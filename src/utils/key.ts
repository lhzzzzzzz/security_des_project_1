import { KEY_SHIFT, PC_1, PC_2 } from "./constants";

/**
 * Calculate the parity bit for a 7-bit binary string.
 * The parity bit ensures that the total number of 1s in the 8-bit result is odd.
 * 
 * @param sevenBits - A 7-bit binary string
 * @returns The parity bit ('0' or '1')
 */
const calculateParityBit = (sevenBits: string): string => {
    const countOfOnes = sevenBits.split('').filter(bit => bit === '1').length;
    return countOfOnes % 2 === 0 ? '1' : '0';
};

/**
 * Generate a 64-bit key from an 8-character input string.
 * Each character is converted to its 7-bit ASCII representation,
 * and a parity bit is added to make each byte.
 * 
 * @param input - An 8-character string
 * @returns A 64-bit binary string
 * @throws Error if input length is not 8 or if non-ASCII characters are used
 */
const generate64BitKey = (input: string): string => {
    if (input.length !== 8) {
        throw new Error('Input must be exactly 8 characters long');
    }

    let binaryKey = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        if (charCode > 127) {
            throw new Error('Only ASCII characters are allowed');
        }
        // Get the last 7 bits of the character's binary representation
        const sevenBits = charCode.toString(2).padStart(8, '0').slice(-7);
        // Calculate and add the parity bit
        const parityBit = calculateParityBit(sevenBits);
        binaryKey += sevenBits + parityBit;
    }

    return binaryKey;
};

/**
 * Perform XOR operation on two 64-bit binary keys.
 * 
 * @param key1 - First 64-bit binary key
 * @param key2 - Second 64-bit binary key
 * @returns Result of XOR operation as a 64-bit binary string
 */
const xorBinaryKeys = (key1: string, key2: string): string => {
    let result = '';
    for (let i = 0; i < key1.length; i++) {
        result += (key1[i] === key2[i]) ? '0' : '1';  // XOR: same is 0, different is 1
    }
    return result;
};

/**
 * Process a key of any length to generate a 64-bit key.
 * If the input is longer than 8 characters, it's split into 8-character chunks,
 * each chunk is converted to a 64-bit key, and all resulting keys are XORed together.
 * 
 * @param input - A string of any length
 * @returns A 64-bit binary key
 */
const processKey = (input: string): string => {
    // Ensure the length is a multiple of 8, pad with '0' if necessary
    const paddedInput = input.padEnd(Math.ceil(input.length / 8) * 8, '0');

    // Process in 8-character chunks
    let keys: string[] = [];
    for (let i = 0; i < paddedInput.length; i += 8) {
        const chunk = paddedInput.slice(i, i + 8);
        const key = generate64BitKey(chunk);
        keys.push(key);
    }

    // XOR all generated 64-bit keys if there are multiple
    let finalKey = keys[0];
    for (let i = 1; i < keys.length; i++) {
        finalKey = xorBinaryKeys(finalKey, keys[i]);
    }

    return finalKey;
};

/**
 * Rearrange a binary string based on a given permutation array.
 * This function is used in various stages of the DES algorithm for permutation.
 * 
 * @param binaryString - The original binary string
 * @param permutationArray - An array specifying the new order of bits
 * @param arrayLength - The length of the permutation array
 * @returns The rearranged binary string
 */
export const rangeBits = (
    binaryString: string,
    permutationArray: number[],
    arrayLength: number
): string => {
    let rearrangedString = '';

    for (let i = 0; i < arrayLength; i++) {
        // Get the position from the permutation array (subtract 1 as array is 1-indexed)
        const index = permutationArray[i] - 1;
        rearrangedString += binaryString[index];
    }

    return rearrangedString;
};

/**
 * Perform a circular left shift on a binary string.
 * 
 * @param binaryString - The binary string to be shifted
 * @param shiftCount - The number of positions to shift
 * @returns The shifted binary string
 */
const leftShift = (binaryString: string, shiftCount: number): string => {
    return binaryString.slice(shiftCount) + binaryString.slice(0, shiftCount);
};

/**
 * Generate 16 subkeys from a 56-bit key.
 * This is a core part of the DES key schedule.
 * 
 * @param key56bit - A 56-bit key
 * @returns An array of 16 48-bit subkeys
 */
export const generateSubKeys = (key56bit: string): string[] => {
    // Split the 56-bit key into two 28-bit halves
    let left28bit = key56bit.slice(0, 28);
    let right28bit = key56bit.slice(28, 56);

    const subKeys: string[] = [];

    // Generate 16 subkeys through left shifts and permutation
    for (let i = 0; i < 16; i++) {
        // Perform left shifts according to the KEY_SHIFT schedule
        left28bit = leftShift(left28bit, KEY_SHIFT[i]);
        right28bit = leftShift(right28bit, KEY_SHIFT[i]);

        // Combine the shifted halves
        const combinedKey = left28bit + right28bit;

        // Apply PC-2 permutation to get the 48-bit subkey
        const key48Bit = rangeBits(combinedKey, PC_2, 48);
        subKeys.push(key48Bit);
    }

    return subKeys;
};

/**
 * Generate the final set of 16 subkeys for DES encryption/decryption.
 * 
 * @param input - The initial key string
 * @returns An array of 16 48-bit subkeys
 */
const outPutKeys = (input: string): string[] => {
    const final64BitKey = processKey(input);
    console.log("final64BitKey: ", final64BitKey);

    // Apply PC-1 permutation to reduce 64-bit key to 56 bits
    const afterPC1 = rangeBits(final64BitKey, PC_1, 56);
    console.log("After PC-1:", afterPC1);

    // Generate and return the 16 subkeys
    const subKeys = generateSubKeys(afterPC1);
    console.log("Generated subkeys:", subKeys);
    return subKeys;
};

/**
 * Public function to get the 16 subkeys for DES.
 * 
 * @param key - The initial key string
 * @returns An array of 16 48-bit subkeys
 */
export const getOutPutKeys = (key: string): string[] => {
    return outPutKeys(key);
};