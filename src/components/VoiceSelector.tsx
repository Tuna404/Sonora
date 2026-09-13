interface Props {
  voices: string[];
  value: string;
  onChange: (v: string) => void;
}

function VoiceSelector(props: Props) {
  return (
    <div class="flex items-center gap-2">
      <label class="text-xs font-medium text-gray-400">
        Voice
      </label>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-3 focus:ring-blue-900"
      >
        <option value="" disabled>
          Select a voice...
        </option>
        {props.voices.map((v) => (
          <option value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

export default VoiceSelector;
