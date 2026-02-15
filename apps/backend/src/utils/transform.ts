// utils/transform.ts
type Primitive = string | number | boolean | null | undefined

type TransformBigInt<T> = T extends bigint
	? number
	: T extends Primitive
		? T
		: T extends Array<infer U>
			? TransformBigInt<U>[]
			: T extends object
				? { [K in keyof T]: TransformBigInt<T[K]> }
				: T

export const transformBigInts = <T>(data: T): TransformBigInt<T> => {
	if (data === null || data === undefined) {
		return data as TransformBigInt<T>
	}
	if (typeof data === "bigint") {
		return Number(data) as TransformBigInt<T>
	}
	if (Array.isArray(data)) {
		return data.map(transformBigInts) as TransformBigInt<T>
	}
	if (data instanceof Date) {
		return data as TransformBigInt<T>
	}
	if (typeof data === "object") {
		const result: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(data)) {
			result[key] = transformBigInts(value)
		}
		return result as TransformBigInt<T>
	}
	return data as TransformBigInt<T>
}
