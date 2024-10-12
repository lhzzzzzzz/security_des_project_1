import { KEY_SHIFT, PC_1, PC_2 } from "./constants";

// 计算奇校验位
const calculateParityBit = (sevenBits: string): string => {
    const countOfOnes = sevenBits.split('').filter(bit => bit === '1').length;
    return countOfOnes % 2 === 0 ? '1' : '0';
};

// 生成64位密钥
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
        // 获取字符的后7位二进制表示
        const sevenBits = charCode.toString(2).padStart(8, '0').slice(-7);
        // 计算并添加奇偶校验位
        const parityBit = calculateParityBit(sevenBits);
        binaryKey += sevenBits + parityBit;
    }

    return binaryKey;
};


// 将两个64位二进制密钥进行异或运算
const xorBinaryKeys = (key1: string, key2: string): string => {
    let result = '';
    for (let i = 0; i < key1.length; i++) {
        result += (key1[i] === key2[i]) ? '0' : '1';  // XOR: 相同为0，不同为1
    }
    return result;
};

// 处理任意长度密钥的函数
const processKey = (input: string): string => {
    // 确保长度是8的倍数，补齐到最近的8位
    const paddedInput = input.padEnd(Math.ceil(input.length / 8) * 8, '0');

    // 分块处理，每8个字符为一组
    let keys: string[] = [];
    for (let i = 0; i < paddedInput.length; i += 8) {
        const chunk = paddedInput.slice(i, i + 8);
        const key = generate64BitKey(chunk);
        keys.push(key);
    }

    // 如果有多个64位密钥，进行异或运算
    let finalKey = keys[0];
    for (let i = 1; i < keys.length; i++) {
        finalKey = xorBinaryKeys(finalKey, keys[i]);
    }

    return finalKey;
};

/**
 * 将二进制字符串根据给定的索引数组重新排列
 * @param binaryString 原始二进制字符串
 * @param permutationArray 映射数组，指定字符串重新排列的顺序
 * @param arrayLength 数组长度
 * @returns 重新排列后的二进制字符串
 */
export const rangeBits = (
    binaryString: string,
    permutationArray: number[],
    arrayLength: number
): string => {
    let rearrangedString = '';

    for (let i = 0; i < arrayLength; i++) {
        // 获取映射表中的位置信息
        const index = permutationArray[i] - 1; // 映射表是从1开始，字符串索引从0开始，所以减1
        rearrangedString += binaryString[index];
        // console.log("i ", i, "  index ", index, binaryString[index])
    }

    return rearrangedString;
};

/**
 * 循环左移操作
 * @param binaryString 需要左移的二进制字符串
 * @param shiftCount 左移的位数
 * @returns 左移后的二进制字符串
 */
const leftShift = (binaryString: string, shiftCount: number): string => {
    const b = binaryString.slice(shiftCount) + binaryString.slice(0, shiftCount);
    return b;

};

/**
 * 根据KEY_SHIFT数组生成16个子密钥
 * @param key64bit 64位初始密钥
 * @returns 16个子密钥
 */
export const generateSubKeys = (key56bit: string): string[] => {

    // 第二步：将56位密钥拆分为前28位和后28位
    let left28bit = key56bit.slice(0, 28);
    let right28bit = key56bit.slice(28, 56); // 确保切片到56位

    console.log(left28bit);
    console.log(right28bit);

    const subKeys: string[] = [];

    // 第三步：根据KEY_SHIFT数组对每个部分分别进行左移，并合并
    for (let i = 0; i < 16; i++) {
        left28bit = leftShift(left28bit, KEY_SHIFT[i]);
        right28bit = leftShift(right28bit, KEY_SHIFT[i]);

        // 将左移后的左右两部分拼接起来，得到一个56位的密钥
        const combinedKey = left28bit + right28bit;
        // console.log(i + "次");
        // console.log(combinedKey);
        // 使用PC_2数组将其转换为48位
        const key48Bit = rangeBits(combinedKey, PC_2, 48);
        subKeys.push(key48Bit);
    }

    return subKeys;
};



const outPutKeys = (input: string): string[] => {
    // const final64BitKey = strToBin(input);
    const final64BitKey = processKey(input);
    console.log("final64BitKey: ", final64BitKey);
    const afterPC1 = rangeBits(final64BitKey, PC_1, 56);

    console.log(afterPC1);
    const subKeys = generateSubKeys(afterPC1);

    console.log(subKeys);
    return subKeys;
};


export const getOutPutKeys = (key: string): string[] => {
    return outPutKeys(key);
};