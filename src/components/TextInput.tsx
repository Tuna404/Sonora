interface Props {
  value: string;
  onChange: (v: string) => void;
}

function TextInput(props: Props) {
  return (
    <textarea
      value={props.value}
      onInput={(e) => props.onChange(e.currentTarget.value)}
      placeholder="Enter text to speak..."
      class="w-full flex-1 resize-none rounded-md border border-gray-800 bg-gray-900 p-4 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-900"
    />
  );
}

export default TextInput;
