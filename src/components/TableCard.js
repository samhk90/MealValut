import { useNavigate } from 'react-router-dom';
// ...existing imports...

export default function TableCard({ table }) {
  const navigate = useNavigate();

  const handleTableClick = () => {
    navigate(`/order/${table.id}`);
  };

  return (
    <div 
      onClick={handleTableClick}
      className="cursor-pointer p-4 bg-white rounded-lg shadow hover:shadow-md transition-all"
    >
      // ...existing content...
    </div>
  );
}
