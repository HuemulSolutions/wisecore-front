import { useNavigate } from "react-router-dom";

interface TemplateItemProps {
  doc: {
    id: string;
    name: string;
    description?: string;
  };
}

const Template: React.FC<TemplateItemProps> = ({ doc }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/configTemplate/${doc.id}`);
  };

  return (
    <li key={doc.id}>
      <button 
        onClick={handleClick}
        className="w-full p-4 bg-white rounded shadow text-left transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] cursor-pointer"
      >
        <h2 className="text-lg font-semibold">{doc.name.charAt(0).toUpperCase() + doc.name.slice(1).toLowerCase()}</h2>
        {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
      </button>
    </li>
  );
};

export default Template;