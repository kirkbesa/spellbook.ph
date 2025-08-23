// src/hooks/binders/cardTypes.ts
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'
export type CardFinish = 'non_foil' | 'foil' | 'etched'
export type PriceMode = 'fixed' | 'scryfall'
export type TcgBasis = 'listed_median' | 'market' | 'high' | 'low'
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'archived'

export type BinderCard = {
    id: string
    binder_id: string
    card_id: string
    quantity: number
    reserved_quantity: number
    condition: CardCondition
    finish: CardFinish
    language: string | null
    price_mode: PriceMode
    fixed_price: number | null
    tcg_basis: TcgBasis | null
    computed_price: number | null
    listing_status: ListingStatus
    created_at: string
    updated_at: string
    fx_multiplier?: number | null
    display_price?: number | null
    price_currency?: string | null
    card: {
        scryfall_id: string
        name: string
        set_code: string
        collector_number: string
        image_small: string | null
        image_normal: string | null
        set_icon_svg_uri: string | null
        scry_usd?: number | null
        scry_usd_foil?: number | null
        scry_usd_etched?: number | null
    } | null
}
