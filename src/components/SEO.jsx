import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SEO = ({
    title = 'Ellite Bling - Luxury Artificial Jewelry Wholesale in Pakistan',
    description = 'Ellite Bling is Pakistan\'s premier destination for luxury artificial jewelry at wholesale prices. Shop bridal sets, necklaces, earrings, and rings with fast nationwide delivery.',
    canonical,
    ogImage = 'https://ellitebling.com/og-image.svg',
    type = 'website'
}) => {
    const location = useLocation()
    const currentUrl = `https://ellitebling.com${location.pathname}`
    const canonicalUrl = canonical || currentUrl

    useEffect(() => {
        // Update document title
        const formattedTitle = title.includes('Ellite Bling') ? title : `${title} | Ellite Bling`
        document.title = formattedTitle

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]')
        if (!metaDesc) {
            metaDesc = document.createElement('meta')
            metaDesc.setAttribute('name', 'description')
            document.head.appendChild(metaDesc)
        }
        metaDesc.setAttribute('content', description)

        // Update canonical tag
        let canonicalTag = document.querySelector('link[rel="canonical"]')
        if (!canonicalTag) {
            canonicalTag = document.createElement('link')
            canonicalTag.setAttribute('rel', 'canonical')
            document.head.appendChild(canonicalTag)
        }
        canonicalTag.setAttribute('href', canonicalUrl)

        // Update Open Graph tags
        const setMeta = (property, content) => {
            let tag = document.querySelector(`meta[property="${property}"]`)
            if (!tag) {
                tag = document.createElement('meta')
                tag.setAttribute('property', property)
                document.head.appendChild(tag)
            }
            tag.setAttribute('content', content)
        }

        setMeta('og:title', formattedTitle)
        setMeta('og:description', description)
        setMeta('og:url', currentUrl)
        setMeta('og:image', ogImage)
        setMeta('og:type', type)

    }, [title, description, canonicalUrl, currentUrl, ogImage, type])

    return null
}

export default SEO
