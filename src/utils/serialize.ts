/**
 * Recursively converts all BigInt values in an object or array to strings.
 * This prevents "Do not know how to serialize a BigInt" TypeError in JSON.stringify/NextResponse.json.
 */
export function serializeBigInt<T>(obj: T): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = serializeBigInt((obj as any)[key]);
            }
        }
        return result;
    }
    return obj;
}
