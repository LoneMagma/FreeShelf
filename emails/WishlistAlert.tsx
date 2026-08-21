import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Hr, Img, Preview, Font,
} from '@react-email/components'
import * as React from 'react'

interface DealItem {
  title:         string
  platform:      string
  originalPrice: number
  currency:      string
  coverImage:    string
  claimUrl:      string
  endDate:       string | null
  hoursLeft:     number | null
}

interface WishlistAlertProps {
  userName:        string
  deals:           DealItem[]
  unsubscribeUrl:  string
  siteUrl:         string
}

function formatPrice(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

function formatExpiry(hoursLeft: number | null, endDate: string | null): string {
  if (!endDate) return 'Permanently free'
  if (hoursLeft !== null && hoursLeft <= 24) return `⚡ Expires in ${Math.round(hoursLeft)}h — claim now`
  if (hoursLeft !== null && hoursLeft <= 72) return `Expires in ${Math.round(hoursLeft / 24)}d`
  if (endDate) {
    return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  return 'Limited time'
}

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    epic: 'Epic Games', gog: 'GOG', steam: 'Steam',
    prime: 'Prime Gaming', humble: 'Humble Bundle',
    itch: 'itch.io', fanatical: 'Fanatical', other: 'Store',
  }
  return map[p] ?? p
}

export default function WishlistAlert({
  userName, deals, unsubscribeUrl, siteUrl,
}: WishlistAlertProps) {
  const previewText = deals.length === 1
    ? `${deals[0].title} is now free — claim it before it expires`
    : `${deals.length} games on your wishlist just went free`

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Link href={siteUrl} style={styles.logo}>FreeShelf</Link>
            <Text style={styles.tagline}>Free game alerts</Text>
          </Section>

          {/* Hero */}
          <Section style={styles.hero}>
            <Heading style={styles.heroHeading}>
              {deals.length === 1
                ? 'A wishlisted game just went free'
                : `${deals.length} wishlisted games just went free`}
            </Heading>
            <Text style={styles.heroSubtext}>
              Hey {userName || 'there'} — good news. Claim before {deals.length === 1 ? 'it expires' : 'they expire'}.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Deal cards */}
          {deals.map((deal, i) => (
            <Section key={i} style={styles.dealCard}>
              <Row>
                {deal.coverImage && (
                  <Column style={styles.coverCol}>
                    <Img
                      src={deal.coverImage}
                      alt={deal.title}
                      width={96}
                      height={54}
                      style={styles.cover}
                    />
                  </Column>
                )}
                <Column style={styles.infoCol}>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                  <Text style={styles.dealMeta}>
                    {platformLabel(deal.platform)} ·{' '}
                    <span style={styles.wasPrice}>
                      was {formatPrice(deal.originalPrice, deal.currency)}
                    </span>
                  </Text>
                  <Text style={styles.expiry}>
                    {formatExpiry(deal.hoursLeft, deal.endDate)}
                  </Text>
                </Column>
              </Row>
              <Row style={{ marginTop: '12px' }}>
                <Column>
                  <Link href={deal.claimUrl} style={styles.ctaButton}>
                    Claim Free →
                  </Link>
                </Column>
              </Row>
            </Section>
          ))}

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You're receiving this because you wishlisted{' '}
              {deals.map(d => d.title).join(', ')} on{' '}
              <Link href={siteUrl} style={styles.footerLink}>FreeShelf</Link>.
            </Text>
            <Text style={styles.footerText}>
              <Link href={unsubscribeUrl} style={styles.unsubLink}>
                Unsubscribe from deal alerts
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Inline styles (required for email clients) ────────────────────────
const styles = {
  body: {
    backgroundColor: '#0A0A0F',
    margin: '0',
    padding: '0',
    fontFamily: 'Inter, Arial, sans-serif',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#FFFFFF',
    textDecoration: 'none',
    letterSpacing: '-0.5px',
  },
  tagline: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#6366F1',
    textAlign: 'center' as const,
  },
  hero: {
    textAlign: 'center' as const,
    padding: '16px 0 24px',
  },
  heroHeading: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: '0 0 8px',
    lineHeight: '1.3',
  },
  heroSubtext: {
    fontSize: '15px',
    color: '#9CA3AF',
    margin: '0',
  },
  divider: {
    borderColor: '#1E1E2E',
    margin: '24px 0',
  },
  dealCard: {
    backgroundColor: '#111118',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #1E1E2E',
  },
  coverCol: {
    width: '96px',
    verticalAlign: 'top' as const,
    paddingRight: '12px',
  },
  cover: {
    borderRadius: '6px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  infoCol: {
    verticalAlign: 'top' as const,
  },
  dealTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    margin: '0 0 4px',
    lineHeight: '1.3',
  },
  dealMeta: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '0 0 4px',
  },
  wasPrice: {
    textDecoration: 'line-through',
  },
  expiry: {
    fontSize: '12px',
    color: '#10B981',
    margin: '0',
    fontWeight: '500',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
    padding: '8px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  footer: {
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '11px',
    color: '#4B5563',
    margin: '4px 0',
    lineHeight: '1.6',
  },
  footerLink: {
    color: '#6366F1',
    textDecoration: 'none',
  },
  unsubLink: {
    color: '#4B5563',
    textDecoration: 'underline',
  },
}
