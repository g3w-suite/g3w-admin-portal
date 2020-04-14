export interface IPictures {
    id: number
    order: number
    image: string
    main_color: string
    main_title_color: string
    subtitle_color: string
    author: string
    author_url: string
    img_obj?: any
}

export interface IPicturesPagination {
    count: number
    next: string | null
    previous: string | null
    results : IPictures[]
}
