// +build amd64

// func DoSyscall(ssn uint32, args ...uintptr) uint32
TEXT ·DoSyscall(SB), $0
    MOVL ssn+0(FP), AX       // SSN (32-bit) into AX
    
    // args is a slice: { ptr (8 bytes), len (8 bytes), cap (8 bytes) }
    // ptr is at 8(FP)
    MOVQ args_ptr+8(FP), SI  // SI = pointer to uintptr array
    
    // Load first 4 args into registers
    MOVQ 0(SI), R10          // Arg1 (replaces RCX for syscall)
    MOVQ 8(SI), RDX          // Arg2
    MOVQ 16(SI), R8          // Arg3
    MOVQ 24(SI), R9          // Arg4
    
    // Reserve shadow space (32 bytes) + space for extra 7 args (56 bytes) = 88 bytes
    // We round up to 96 for stack alignment
    SUBQ $96, SP             
    
    // Copy remaining args (5 through 11) to the stack
    MOVQ 32(SI), R11;  MOVQ R11, 32(SP)  // Arg5
    MOVQ 40(SI), R11;  MOVQ R11, 40(SP)  // Arg6
    MOVQ 48(SI), R11;  MOVQ R11, 48(SP)  // Arg7
    MOVQ 56(SI), R11;  MOVQ R11, 56(SP)  // Arg8
    MOVQ 64(SI), R11;  MOVQ R11, 64(SP)  // Arg9
    MOVQ 72(SI), R11;  MOVQ R11, 72(SP)  // Arg10
    MOVQ 80(SI), R11;  MOVQ R11, 80(SP)  // Arg11

    SYSCALL
    
    ADDQ $96, SP             // Restore stack
    RET
