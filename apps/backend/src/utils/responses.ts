export const successResponse = (data: object, extra?: object | undefined) => {
	return {
		status: "success",
		data,
		...extra,
	}
}

export const errorResponse = (message: string, stack?: unknown, extra?: object | undefined) => {
	return {
		status: "error",
		message,
		stack,
		...extra,
	}
}
