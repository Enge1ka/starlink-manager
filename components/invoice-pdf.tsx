import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format, parseISO, isValid } from 'date-fns'

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? parseISO(d) : d
  if (!isValid(dt)) return '—'
  return format(dt, 'dd/MM/yyyy')
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flexDirection: 'column' },
  headerBlock: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #1a1a1a', paddingBottom: 14 },
  titleBlock: { alignItems: 'flex-start' },
  invoiceTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 2 },
  invoiceNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  companyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companyText: { fontSize: 8.5, color: '#333', lineHeight: 1.5 },
  metaRow: { flexDirection: 'row', marginBottom: 14, gap: 20 },
  metaBlock: { flex: 1, flexDirection: 'column' },
  metaLabel: { fontSize: 8, color: '#666', textTransform: 'uppercase', marginBottom: 3 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  billRow: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  billBlock: { flex: 1 },
  billLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: 2 },
  billValue: { fontSize: 9, lineHeight: 1.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: '5 8', marginBottom: 0 },
  tableHeaderCell: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '0.5px solid #e0e0e0' },
  tableCell: { fontSize: 8.5 },
  totalsBlock: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsTable: { width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '3 6', borderBottom: '0.5px solid #eee' },
  totalsLabel: { fontSize: 8.5, color: '#555' },
  totalsValue: { fontSize: 8.5 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 6', backgroundColor: '#1a1a1a' },
  totalFinalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' },
  totalFinalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' },
  bankBlock: { marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 10 },
  bankTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6, textTransform: 'uppercase' },
  bankRow: { flexDirection: 'row', gap: 40 },
  bankCol: { flexDirection: 'column', gap: 3 },
  bankItem: { flexDirection: 'row', gap: 6 },
  bankLabel: { fontSize: 8, color: '#666', width: 80 },
  bankValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  footer: { marginTop: 16, fontSize: 8, color: '#888', textAlign: 'center', borderTop: '0.5px solid #eee', paddingTop: 8 },
})

type InvoiceItem = {
  id: string; code?: string | null; description: string; quantity: number
  unit?: string | null; unitPrice: number; discountPct: number; taxPct: number; nettPrice: number
}

type Invoice = {
  invoiceNumber: string; issueDate: string | Date; dueDate: string | Date
  status: string; notes?: string | null
  subtotal: number; discountPct: number; discountAmt: number; taxAmt: number; total: number; amountPaid: number; balance: number
  customer: { code: string; name: string; company?: string | null; address?: string | null; phone?: string | null; email?: string | null; tpin?: string | null }
  items: InvoiceItem[]
  payments: { id: string; amount: number; paymentDate: string | Date; method?: string | null; reference?: string | null }[]
}

type Settings = {
  companyName: string; companyAddress: string; companyPhone: string; companyEmail: string
  bankAccountName: string; bankName: string; bankAccountNumber: string
  bankBranchName: string; bankBranchCode: string; bankSortCode: string; bankSwift: string
  currencySymbol: string; showBankDetails: boolean; showCodeColumn: boolean
  showUnitColumn: boolean; showTaxColumn: boolean; showDiscountColumn: boolean
  showShipTo: boolean; showYourReference: boolean; showTaxReference: boolean
  footerText: string
} | null

export function InvoicePDF({ invoice, settings }: { invoice: Invoice; settings: Settings }) {
  const sym = settings?.currencySymbol ?? 'K'
  const showCode = settings?.showCodeColumn ?? true
  const showUnit = settings?.showUnitColumn ?? true
  const showTax = settings?.showTaxColumn ?? true
  const showDisc = settings?.showDiscountColumn ?? true
  const showBank = settings?.showBankDetails ?? true

  const colWidths = {
    code: showCode ? '8%' : '0%',
    desc: showCode && showUnit && showTax && showDisc ? '32%' : '40%',
    qty: '8%',
    unit: showUnit ? '8%' : '0%',
    price: '14%',
    disc: showDisc ? '10%' : '0%',
    tax: showTax ? '8%' : '0%',
    nett: '14%',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <View style={styles.titleBlock}>
            <Text style={styles.invoiceTitle}>Tax Invoice</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
              <View><Text style={{ fontSize: 8, color: '#666' }}>Date</Text><Text style={{ fontSize: 9 }}>{fmtDate(invoice.issueDate)}</Text></View>
              <View><Text style={{ fontSize: 8, color: '#666' }}>Page</Text><Text style={{ fontSize: 9 }}>1</Text></View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            <Text style={[styles.companyName, { marginTop: 8 }]}>{settings?.companyName ?? 'PrimeGrid Technologies'}</Text>
            <Text style={styles.companyText}>{(settings?.companyAddress ?? '').split(',').map(s => s.trim()).join('\n')}</Text>
            {settings?.companyEmail ? <Text style={styles.companyText}>{settings.companyEmail}</Text> : null}
            {settings?.companyPhone ? <Text style={styles.companyText}>{settings.companyPhone}</Text> : null}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billRow}>
          <View style={styles.billBlock}>
            <Text style={styles.billLabel}>Bill To: {invoice.customer.code}</Text>
            <Text style={styles.billValue}>{invoice.customer.name}{invoice.customer.company ? ` - ${invoice.customer.company}` : ' -'}</Text>
            {invoice.customer.address ? <Text style={styles.billValue}>{invoice.customer.address}</Text> : null}
            {invoice.customer.phone ? <Text style={styles.billValue}>{invoice.customer.phone}</Text> : null}
            {invoice.customer.email ? <Text style={styles.billValue}>{invoice.customer.email}</Text> : null}
          </View>
          {settings?.showShipTo && (
            <View style={styles.billBlock}>
              <Text style={styles.billLabel}>Ship To:</Text>
            </View>
          )}
          <View style={{ width: 200, flexDirection: 'column', gap: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '3 0', borderBottom: '0.5px solid #eee' }}>
              <Text style={{ fontSize: 8, color: '#666' }}>Due By</Text>
              <Text style={{ fontSize: 8 }}>{fmtDate(invoice.dueDate)}</Text>
            </View>
            {settings?.showYourReference && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '3 0', borderBottom: '0.5px solid #eee' }}>
                <Text style={{ fontSize: 8, color: '#666' }}>Your Reference</Text>
                <Text style={{ fontSize: 8 }}></Text>
              </View>
            )}
            {settings?.showTaxReference && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '3 0', borderBottom: '0.5px solid #eee' }}>
                <Text style={{ fontSize: 8, color: '#666' }}>Tax Reference</Text>
                <Text style={{ fontSize: 8 }}></Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '3 0', borderBottom: '0.5px solid #eee' }}>
              <Text style={{ fontSize: 8, color: '#666' }}>Tax Exempt</Text>
              <Text style={{ fontSize: 8 }}>N</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '3 0' }}>
              <Text style={{ fontSize: 8, color: '#666' }}>Incl/Excl</Text>
              <Text style={{ fontSize: 8 }}>Exclusive</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={{ marginTop: 10 }}>
          <View style={styles.tableHeader}>
            {showCode && <Text style={[styles.tableHeaderCell, { width: colWidths.code }]}>Code</Text>}
            <Text style={[styles.tableHeaderCell, { width: colWidths.desc }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: colWidths.qty, textAlign: 'right' }]}>Qty</Text>
            {showUnit && <Text style={[styles.tableHeaderCell, { width: colWidths.unit }]}>Unit</Text>}
            <Text style={[styles.tableHeaderCell, { width: colWidths.price, textAlign: 'right' }]}>Unit Price</Text>
            {showDisc && <Text style={[styles.tableHeaderCell, { width: colWidths.disc, textAlign: 'right' }]}>Disc%</Text>}
            {showTax && <Text style={[styles.tableHeaderCell, { width: colWidths.tax, textAlign: 'right' }]}>Tax</Text>}
            <Text style={[styles.tableHeaderCell, { width: colWidths.nett, textAlign: 'right' }]}>Nett Price</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              {showCode && <Text style={[styles.tableCell, { width: colWidths.code }]}>{item.code ?? ''}</Text>}
              <Text style={[styles.tableCell, { width: colWidths.desc }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { width: colWidths.qty, textAlign: 'right' }]}>{item.quantity.toFixed(2)}</Text>
              {showUnit && <Text style={[styles.tableCell, { width: colWidths.unit }]}>{item.unit ?? ''}</Text>}
              <Text style={[styles.tableCell, { width: colWidths.price, textAlign: 'right' }]}>{fmtMoney(item.unitPrice)}</Text>
              {showDisc && <Text style={[styles.tableCell, { width: colWidths.disc, textAlign: 'right' }]}>{item.discountPct.toFixed(2)}%</Text>}
              {showTax && <Text style={[styles.tableCell, { width: colWidths.tax, textAlign: 'right' }]}>{item.taxPct.toFixed(2)}%</Text>}
              <Text style={[styles.tableCell, { width: colWidths.nett, textAlign: 'right' }]}>{fmtMoney(item.nettPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 10, padding: '8 10', backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text style={{ fontSize: 8, color: '#555' }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sub Total</Text>
              <Text style={styles.totalsValue}>{sym} {fmtMoney(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount @ {invoice.discountPct.toFixed(2)}%</Text>
              <Text style={styles.totalsValue}>{fmtMoney(invoice.discountAmt)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Amount Excl Tax</Text>
              <Text style={styles.totalsValue}>{sym} {fmtMoney(invoice.subtotal - invoice.discountAmt)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{fmtMoney(invoice.taxAmt)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{sym} {fmtMoney(invoice.total)}</Text>
            </View>
            {invoice.amountPaid > 0 && (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Amount Paid</Text>
                  <Text style={styles.totalsValue}>{sym} {fmtMoney(invoice.amountPaid)}</Text>
                </View>
                <View style={[styles.totalsRow, { backgroundColor: '#fff3f3' }]}>
                  <Text style={[styles.totalsLabel, { fontFamily: 'Helvetica-Bold' }]}>Balance Due</Text>
                  <Text style={[styles.totalsValue, { fontFamily: 'Helvetica-Bold', color: '#c00' }]}>{sym} {fmtMoney(invoice.balance)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bank Details */}
        {showBank && (
          <View style={styles.bankBlock}>
            <Text style={styles.bankTitle}>Bank Details</Text>
            <View style={styles.bankRow}>
              <View style={styles.bankCol}>
                {[
                  { label: 'Account Name', value: settings?.bankAccountName ?? '' },
                  { label: 'Bank', value: settings?.bankName ?? '' },
                  { label: 'Account Number', value: settings?.bankAccountNumber ?? '' },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.bankItem}>
                    <Text style={styles.bankLabel}>{label}</Text>
                    <Text style={styles.bankValue}>{value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.bankCol}>
                {[
                  { label: 'Branch Name', value: settings?.bankBranchName ?? '' },
                  { label: 'Branch Code', value: settings?.bankBranchCode ?? '' },
                  { label: 'Branch Sort Code', value: settings?.bankSortCode ?? '' },
                  { label: 'SWIFT Code', value: settings?.bankSwift ?? '' },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.bankItem}>
                    <Text style={styles.bankLabel}>{label}</Text>
                    <Text style={styles.bankValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        {settings?.footerText && <Text style={styles.footer}>{settings.footerText}</Text>}
      </Page>
    </Document>
  )
}
