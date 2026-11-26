'use client'

import Link from 'next/link'
import { ArrowRight, Gift } from 'lucide-react'
import { useT } from '@/app/i18n/client'
import styles from './ChristmasPromotion.module.css'

export default function ChristmasPromotion({ lng, discount }: { lng: string; discount: number }) {
	const { t } = useT('translations')

	return (
		<aside id="christmas-promotion" className={styles.promotion} aria-label={t('promotion.label')}>
			<span className={styles.leftDecoration} aria-hidden="true" />
			<span className={`${styles.rightDecoration} rotate-180`} aria-hidden="true" />
			<div className={styles.content}>
				<p className={styles.message}>
					<Gift size={18} strokeWidth={1.5} className={styles.gift} aria-hidden="true" />
					<span>{t('promotion.message', { discount })}</span>
				</p>
				<Link href={`/${lng}/produkte`} className={styles.link}>
					{t('promotion.link')}
					<ArrowRight size={14} aria-hidden="true" />
				</Link>
			</div>
		</aside>
	)
}
