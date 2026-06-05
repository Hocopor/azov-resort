'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS, type FaqItem } from '@/lib/seo'

export function FaqSection({ items = FAQ_ITEMS, title = 'Частые вопросы' }: { items?: FaqItem[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="mb-6 text-center font-display text-3xl font-bold text-gray-900">{title}</h2>
        <div className="space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question} className="overflow-hidden rounded-2xl border border-gray-100 bg-sand-50">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-sea-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{item.answer}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
