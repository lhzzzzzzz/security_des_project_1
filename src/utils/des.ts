import { appendFile } from "fs";
import { IP, IP_INVERSE, E_SELECTION, S_BOX, P_TRANSFORM } from "./constants";
import { getOutPutKeys, rangeBits } from "./key";


// 将二进制字符串转换为十六进制字符串
const binaryToHex = (binary: string): string => {
    console.log("Binary: " + binary);
    if (binary.length % 4 !== 0) {
        throw new Error("Binary string length must be a multiple of 4.");
    }

    let hexString = '';

    // 每4位二进制表示一个十六进制字符
    for (let i = 0; i < binary.length; i += 4) {
        const fourBits = binary.slice(i, i + 4);
        const hex = parseInt(fourBits, 2).toString(16);  // 将4位二进制转换为16进制
        hexString += hex;
    }

    return hexString.toUpperCase();  // 返回大写的十六进制字符串
};

// 将十六进制字符串转换为二进制字符串
const hexToBinary = (hex: string): string => {
    let binaryString = '';

    // 每个十六进制字符转换为4位二进制
    for (let i = 0; i < hex.length; i++) {
        const binary = parseInt(hex[i], 16).toString(2).padStart(4, '0');
        binaryString += binary;
    }

    return binaryString;
};





const stringToBinary = (input: string): string => {
    // 使用TextEncoder将字符串转换为UTF-8编码的字节数组
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(input);

    let binaryString = '';

    // 将每个字节（0-255的数字）转换为8位二进制表示
    for (let i = 0; i < utf8Bytes.length; i++) {
        const binaryChar = utf8Bytes[i].toString(2).padStart(8, '0');
        binaryString += binaryChar;
    }

    console.log("UTF-8 Binary: " + binaryString);

    // 将二进制字符串补齐到64的倍数
    const paddedBinaryString = binaryString.padEnd(Math.ceil(binaryString.length / 64) * 64, '0');

    console.log("Padded Binary (64-multiple): " + paddedBinaryString);

    return paddedBinaryString;
};



export const binaryToString = (binary: string): string => {
    const bytes = [];

    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.slice(i, i + 8);
        const charCode = parseInt(byte, 2);
        bytes.push(charCode);
    }

    const decoder = new TextDecoder();
    const result = decoder.decode(new Uint8Array(bytes));

    console.log("Decoded UTF-8 String: " + result);

    return result;
};


const splitBinary = (input: string): [string, string] => {
    if (input.length !== 64) {
        throw new Error('Input must be a 64-bit binary string');
    }
    return [input.slice(0, 32), input.slice(32)];
};

// e_transform 函数：将32位二进制字符串扩展为48位
export const e_transform = (input: string): string => {
    if (input.length !== 32) {
        throw new Error('The input binary string must be 32 bits');
    }

    let output = '';

    // 根据 E扩展表 将每个对应位置的二进制位扩展到48位
    for (let i = 0; i < E_SELECTION.length; i++) {
        const position = E_SELECTION[i] - 1;  // 因为数组索引从0开始，需要减1
        output += input[position];
    }

    return output;
};

const xorBinaryStrings = (binaryString1: string, binaryString2: string, length: number): string => {
    let result = '';

    for (let i = 0; i < length; i++) {
        // 异或运算：相同为0，不同为1
        result += (binaryString1[i] === binaryString2[i]) ? '0' : '1';
    }

    return result;
};

/**
 * 将十进制数字转换为指定长度的二进制字符串
 * @param num 十进制数字
 * @param length 二进制字符串长度
 * @returns 指定长度的二进制字符串
 */
const decimalToBinary = (num: number, length: number): string => {
    return num.toString(2).padStart(length, '0');
};

const swapStrings = (arr: [string, string]): [string, string] => {
    [arr[0], arr[1]] = [arr[1], arr[0]];
    return arr;
}



const sBoxTransform = (input48bit: string): string => {
    let output32bit = '';

    // 将48位字符串分为8个6位块
    for (let i = 0; i < 8; i++) {
        const sixBits = input48bit.slice(i * 6, i * 6 + 6);

        // 前两位用于选择行索引a (0到3)
        const row = parseInt(sixBits.slice(0, 1) + sixBits.slice(5), 2); // 第一位与最后一位组合成行索引
        // 中间四位用于选择列索引b (0到15)
        const column = parseInt(sixBits.slice(1, 5), 2); // 中间四位组合成列索引

        // 使用S-Box进行查找，得到0到15的值
        const sBoxValue = S_BOX[i][row][column];

        // 将查找的值转换为4位二进制
        output32bit += decimalToBinary(sBoxValue, 4);
    }

    return output32bit;
};



const createDESCipherText = (input: string, key: string): string => {
    const keyArray = getOutPutKeys(key);
    const textBinary = stringToBinary(input);  // 转换明文为二进制
    let cipherText = '';  // 存储加密后的结果

    // 按64位分割输入的二进制字符串，逐块加密
    for (let blockStart = 0; blockStart < textBinary.length; blockStart += 64) {
        const block = textBinary.slice(blockStart, blockStart + 64);  // 提取当前64位的块

        // 如果块不足64位，进行补0
        const paddedBlock = block.padEnd(64, '0');

        // 执行IP置换
        const afterIP = rangeBits(paddedBlock, IP, 64);
        let splitArray = splitBinary(afterIP);
        console.log("P置换结果：", splitArray)

        // 进行16轮加密
        for (let i = 0; i < 16; i++) {
            const temp = splitArray[1]
            console.log(i, "temp: " + temp)
            console.log("i: " + i);
            console.log("splitArray: " + splitArray);
            const e = e_transform(splitArray[1]);
            console.log("e: " + e);
            console.log("key: " + keyArray[i]);
            const xorResult = xorBinaryStrings(e, keyArray[i], 48);
            console.log("xorResult: " + xorResult);
            const sBoxResult = sBoxTransform(xorResult);
            console.log("sBoxResult: " + sBoxResult);
            const p = rangeBits(sBoxResult, P_TRANSFORM, 32);
            console.log("p: " + p);
            const toLeft = xorBinaryStrings(splitArray[0], p, 32);
            console.log("toLeft: " + toLeft);
            splitArray[1] = toLeft;
            console.log("temp2: " + temp)
            splitArray[0] = temp;
            console.log(i, "+++++++", splitArray)
        }

        // 16轮加密结束后进行逆IP置换
        swapStrings(splitArray);
        console.log("splitArray: " + splitArray);
        const afterIPInverse = rangeBits(splitArray[0] + splitArray[1], IP_INVERSE, 64);

        // 将结果拼接到最终的密文
        cipherText += afterIPInverse;
    }

    const result = binaryToHex(cipherText);

    return result;
};


const createDESPlainText = (input: string, key: string): string => {
    const keyArray = getOutPutKeys(key);  // 获取密钥
    let binaryText = ''

    console.log("输入的十六进制数: ", input);
    input = hexToBinary(input);  // 转换密文为二进制
    console.log("转二进制: ", input);

    // 按64位分割输入的密文，逐块解密
    for (let blockStart = 0; blockStart < input.length; blockStart += 64) {
        const block = input.slice(blockStart, blockStart + 64);  // 提取当前64位的块
        console.log(`Processing block ${blockStart / 64 + 1}:`, block);

        // 执行逆IP置换
        const afterIP = rangeBits(block, IP, 64);
        console.log("After Initial Inverse IP:", afterIP);

        let splitArray = splitBinary(afterIP);
        console.log("Split into L0 and R0:", splitArray);

        // 进行16轮解密（从15到0）
        for (let i = 15; i >= 0; i--) {
            const temp = splitArray[1]
            const e = e_transform(splitArray[1]);
            console.log(`Round ${16 - i}: Expansion (E) result:`, e);

            const xorResult = xorBinaryStrings(e, keyArray[i], 48);
            console.log("这次的key是：", keyArray[i])
            console.log(`Round ${16 - i}: XOR result with key:`, xorResult);

            const sBoxResult = sBoxTransform(xorResult);
            console.log(`Round ${16 - i}: S-Box transformation result:`, sBoxResult);

            const p = rangeBits(sBoxResult, P_TRANSFORM, 32);
            console.log(`Round ${16 - i}: P置换后:`, p);

            const toLeft = xorBinaryStrings(splitArray[0], p, 32);
            console.log(`Round ${16 - i}: XOR with Left half (L):`, toLeft);

            splitArray[1] = toLeft;
            splitArray[0] = temp;
            console.log(`Round ${16 - i}: After Swap: L and R:`, splitArray);
        }

        // 解密结束后进行IP置换
        swapStrings(splitArray);
        const afterIPInverse = rangeBits(splitArray[0] + splitArray[1], IP_INVERSE, 64);
        console.log("After Final IP:", afterIPInverse);

        binaryText = binaryText + afterIPInverse;
    }
    return binaryToString(binaryText);  // 返回解密后的明文
};


export const getDESCipherText = (input: string, key: string): string => {
    return createDESCipherText(input, key);
}

export const getDESPlainText = (input: string, key: string): string => {
    return createDESPlainText(input, key);
}
