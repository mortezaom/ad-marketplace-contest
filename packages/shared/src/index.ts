export interface UserModel {
	id: number
	tid: number | null
	first_name: string
	last_name: string | null
	photo_url: string | null
	username: string | null
	created_at: Date
}
