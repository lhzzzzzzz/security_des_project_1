import { IP, IP_INVERSE, E_SELECTION, S_BOX, P_TRANSFORM } from "./constants";
import { getOutPutKeys, rangeBits } from "./key";

/**
 * Convert a binary string to a hexadecimal string.
 * This function is used in the final stage of encryption to present the cipher in hexadecimal format.
 * 
 * @param binary - A string of '0's and '1's
 * @returns The hexadecimal representation of the input binary string, in uppercase
 * @throws Error if the input length is not a multiple of 4
 */
const binaryToHex = (binary: string): string => {
    if (binary.length % 4 !== 0) {
        throw new Error("Binary string length must be a multiple of 4.");
    }

    let hexString = '';
    // Process the binary string in groups of 4 bits
    for (let i = 0; i < binary.length; i += 4) {
        const fourBits = binary.slice(i, i + 4);
        // Convert each 4-bit group to its hexadecimal equivalent
        const hex = parseInt(fourBits, 2).toString(16);
        hexString += hex;
    }

    return hexString.toUpperCase();
};

/**
 * Convert a hexadecimal string to a binary string.
 * This function is used in the initial stage of decryption to convert the hexadecimal cipher to binary.
 * 
 * @param hex - A string of hexadecimal characters
 * @returns The binary representation of the input hexadecimal string
 */
const hexToBinary = (hex: string): string => {
    let binaryString = '';
    for (let i = 0; i < hex.length; i++) {
        // Convert each hexadecimal character to its 4-bit binary representation
        const binary = parseInt(hex[i], 16).toString(2).padStart(4, '0');
        binaryString += binary;
    }
    return binaryString;
};

/**
 * Convert a string to its binary representation, padding to multiples of 64 bits.
 * This is a crucial step in preparing the input text for DES encryption.
 * 
 * @param input - The input string to be converted
 * @returns A binary string representation of the input, padded to a multiple of 64 bits
 */
const stringToBinary = (input: string): string => {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(input);
    let binaryString = '';
    // Convert each UTF-8 byte to its 8-bit binary representation
    for (let i = 0; i < utf8Bytes.length; i++) {
        const binaryChar = utf8Bytes[i].toString(2).padStart(8, '0');
        binaryString += binaryChar;
    }
    // Pad the binary string to ensure its length is a multiple of 64
    return binaryString.padEnd(Math.ceil(binaryString.length / 64) * 64, '0');
};

/**
 * Convert a binary string back to its original string representation.
 * This function is used in the final stage of decryption to recover the original plaintext.
 * 
 * @param binary - A string of '0's and '1's
 * @returns The decoded string from the binary input
 */
export const binaryToString = (binary: string): string => {
    const bytes = [];
    // Process the binary string in groups of 8 bits
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.slice(i, i + 8);
        const charCode = parseInt(byte, 2);
        bytes.push(charCode);
    }
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
};

/**
 * Split a 64-bit binary string into two 32-bit halves.
 * This function is used in the initial stage of both encryption and decryption.
 * 
 * @param input - A 64-bit binary string
 * @returns A tuple containing two 32-bit binary strings
 * @throws Error if the input is not exactly 64 bits
 */
const splitBinary = (input: string): [string, string] => {
    if (input.length !== 64) {
        throw new Error('Input must be a 64-bit binary string');
    }
    return [input.slice(0, 32), input.slice(32)];
};

/**
 * Expansion function: expand a 32-bit binary string to 48 bits.
 * This is a key step in the Feistel function of DES.
 * 
 * @param input - A 32-bit binary string
 * @returns A 48-bit binary string
 * @throws Error if the input is not exactly 32 bits
 */
export const e_transform = (input: string): string => {
    if (input.length !== 32) {
        throw new Error('The input binary string must be 32 bits');
    }
    let output = '';
    // Use the E_SELECTION table to expand the input
    for (let i = 0; i < E_SELECTION.length; i++) {
        const position = E_SELECTION[i] - 1;
        output += input[position];
    }
    return output;
};

/**
 * Perform XOR operation on two binary strings.
 * This function is used multiple times in both encryption and decryption processes.
 * 
 * @param binaryString1 - First binary string
 * @param binaryString2 - Second binary string
 * @param length - The length of both input strings
 * @returns The result of XOR operation as a binary string
 */
const xorBinaryStrings = (binaryString1: string, binaryString2: string, length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
        // XOR operation: 1 if bits are different, 0 if they're the same
        result += (binaryString1[i] === binaryString2[i]) ? '0' : '1';
    }
    return result;
};

/**
 * Convert a decimal number to a binary string of specified length.
 * This helper function is used in various parts of the encryption/decryption process.
 * 
 * @param num - The decimal number to convert
 * @param length - The desired length of the output binary string
 * @returns A binary string representation of the input number, padded to the specified length
 */
const decimalToBinary = (num: number, length: number): string => {
    return num.toString(2).padStart(length, '0');
};

/**
 * Swap two strings in an array.
 * This function is used in the final step of each round in both encryption and decryption.
 * 
 * @param arr - An array containing two strings
 * @returns The same array with the strings swapped
 */
const swapStrings = (arr: [string, string]): [string, string] => {
    [arr[0], arr[1]] = [arr[1], arr[0]];
    return arr;
}

/**
 * Perform the S-Box transformation on a 48-bit input.
 * This is a critical component of the DES algorithm, providing non-linearity.
 * 
 * @param input48bit - A 48-bit binary string
 * @returns A 32-bit binary string after S-Box transformation
 */
const sBoxTransform = (input48bit: string): string => {
    let output32bit = '';
    // Process the input in 8 groups of 6 bits each
    for (let i = 0; i < 8; i++) {
        const sixBits = input48bit.slice(i * 6, i * 6 + 6);
        // Determine row and column for S-Box lookup
        const row = parseInt(sixBits.slice(0, 1) + sixBits.slice(5), 2);
        const column = parseInt(sixBits.slice(1, 5), 2);
        // Perform S-Box substitution
        const sBoxValue = S_BOX[i][row][column];
        output32bit += decimalToBinary(sBoxValue, 4);
    }
    return output32bit;
};

/**
 * Perform DES encryption on the input string using the provided key.
 * This function implements the core DES encryption algorithm.
 * 
 * @param input - The plaintext string to encrypt
 * @param key - The encryption key
 * @returns The ciphertext as a hexadecimal string
 */
const createDESCipherText = (input: string, key: string): string => {
    const keyArray = getOutPutKeys(key);
    const textBinary = stringToBinary(input);
    let cipherText = '';

    // Process the input in 64-bit blocks
    for (let blockStart = 0; blockStart < textBinary.length; blockStart += 64) {
        const block = textBinary.slice(blockStart, blockStart + 64).padEnd(64, '0');
        // Initial permutation
        const afterIP = rangeBits(block, IP, 64);
        let splitArray = splitBinary(afterIP);

        // 16 rounds of Feistel network
        for (let i = 0; i < 16; i++) {
            const temp = splitArray[1];
            // Expansion
            const e = e_transform(splitArray[1]);
            // XOR with round key
            const xorResult = xorBinaryStrings(e, keyArray[i], 48);
            // S-Box substitution
            const sBoxResult = sBoxTransform(xorResult);
            // P-Box permutation
            const p = rangeBits(sBoxResult, P_TRANSFORM, 32);
            // XOR with left half
            const toLeft = xorBinaryStrings(splitArray[0], p, 32);
            // Prepare for next round
            splitArray[1] = toLeft;
            splitArray[0] = temp;
        }

        // Final swap
        swapStrings(splitArray);
        // Inverse initial permutation
        const afterIPInverse = rangeBits(splitArray[0] + splitArray[1], IP_INVERSE, 64);
        cipherText += afterIPInverse;
    }

    // Convert binary ciphertext to hexadecimal
    return binaryToHex(cipherText);
};

/**
 * Perform DES decryption on the input ciphertext using the provided key.
 * This function implements the core DES decryption algorithm.
 * 
 * @param input - The ciphertext as a hexadecimal string
 * @param key - The decryption key
 * @returns The decrypted plaintext string
 */
const createDESPlainText = (input: string, key: string): string => {
    const keyArray = getOutPutKeys(key);
    let binaryText = '';
    input = hexToBinary(input);

    // Process the input in 64-bit blocks
    for (let blockStart = 0; blockStart < input.length; blockStart += 64) {
        const block = input.slice(blockStart, blockStart + 64);
        // Initial permutation
        const afterIP = rangeBits(block, IP, 64);
        let splitArray = splitBinary(afterIP);

        // 16 rounds of Feistel network (in reverse order)
        for (let i = 15; i >= 0; i--) {
            const temp = splitArray[1];
            // Expansion
            const e = e_transform(splitArray[1]);
            // XOR with round key (note the reverse order of keys)
            const xorResult = xorBinaryStrings(e, keyArray[i], 48);
            // S-Box substitution
            const sBoxResult = sBoxTransform(xorResult);
            // P-Box permutation
            const p = rangeBits(sBoxResult, P_TRANSFORM, 32);
            // XOR with left half
            const toLeft = xorBinaryStrings(splitArray[0], p, 32);
            // Prepare for next round
            splitArray[1] = toLeft;
            splitArray[0] = temp;
        }

        // Final swap
        swapStrings(splitArray);
        // Inverse initial permutation
        const afterIPInverse = rangeBits(splitArray[0] + splitArray[1], IP_INVERSE, 64);
        binaryText += afterIPInverse;
    }
    // Convert binary plaintext to string
    return binaryToString(binaryText);
};

/**
 * Public function for DES encryption.
 * This function serves as the main entry point for encryption.
 * 
 * @param input - The plaintext string to encrypt
 * @param key - The encryption key
 * @returns The ciphertext as a hexadecimal string
 */
export const getDESCipherText = (input: string, key: string): string => {
    return createDESCipherText(input, key);
}

/**
 * Public function for DES decryption.
 * This function serves as the main entry point for decryption.
 * 
 * @param input - The ciphertext as a hexadecimal string
 * @param key - The decryption key
 * @returns The decrypted plaintext string
 */
export const getDESPlainText = (input: string, key: string): string => {
    return createDESPlainText(input, key);
}