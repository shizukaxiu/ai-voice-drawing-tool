interface SuggestionChipsProps {
  suggestions: string[]
  onSuggestionClick?: (text: string) => void
}

export function SuggestionChips({ suggestions, onSuggestionClick }: SuggestionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {suggestions.map((text, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSuggestionClick?.(text)}
          disabled={!onSuggestionClick}
          className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 whitespace-nowrap hover:bg-blue-100 transition-colors disabled:opacity-60"
        >
          💡 {text}
        </button>
      ))}
    </div>
  )
}
