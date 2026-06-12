interface SuggestionChipsProps {
  suggestions: string[]
}

export function SuggestionChips({ suggestions }: SuggestionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {suggestions.map((text, index) => (
        <span
          key={index}
          className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 whitespace-nowrap"
        >
          💡 {text}
        </span>
      ))}
    </div>
  )
}
