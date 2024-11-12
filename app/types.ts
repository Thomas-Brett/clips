export interface Clip {
    upload_id: string;
    upload_name: string;
    username: string;
    length: string;
    date_uploaded: number;
}

export interface UserSearchResult {
    id: string;
    username: string;
    clipCount: number;
}

export interface SearchResults {
    clips: any[];
    users: any[];
}
