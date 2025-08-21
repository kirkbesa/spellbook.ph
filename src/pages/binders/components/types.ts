// src/pages/binders/components/types.ts
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'
export type CardFinish = 'non_foil' | 'foil' | 'etched'
export type PriceMode = 'fixed' | 'tcgplayer'
export type TcgBasis = 'listed_median' | 'market' | 'high' | 'low'

export type DbCard = {
    scryfall_id: string
    oracle_id: string | null
    name: string
    set_code: string
    collector_number: string
    image_small: string | null
    image_normal: string | null
    tcgplayer_product_id: number | null
    set_icon_svg_uri?: string | null
}

export type SearchResult = {
    source: 'db' | 'scryfall'
    card: DbCard
}
