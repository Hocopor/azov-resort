// Вставляет микроразметку Schema.org (JSON-LD) в страницу.
// Серверный компонент — рендерится в HTML, поисковик читает её сразу.

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Контент формируем сами из доверенных данных, без пользовательского ввода в ключах.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
