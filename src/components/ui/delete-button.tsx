// ui/delete-button.tsx
export const DeleteButton = ({
  onClick,
}: {
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-transparent text-white w-10 h-10 flex items-center justify-center
               rounded-full transition-all duration-200 cursor-pointer"
    title="Delete Image"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 6h18" />
      <path d="M8 6v-1a2 2 0 012-2h4a2 2 0 012 2v1" />
      <rect x="5" y="6" width="14" height="14" rx="2" />
      <path d="M10 11v4M14 11v4" />
    </svg>
  </div>
);
