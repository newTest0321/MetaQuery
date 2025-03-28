import { useRouter } from 'next/router';

const SessionPage = () => {
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push('/dashboard'); // Adjust the path according to your dashboard route
  };

  return (
    <div>
      <div 
        onClick={handleDashboardClick}
        className="dashboard-box"
        role="button"
        tabIndex={0}
      >
        Darshan
      </div>
    </div>
  );
};

export default SessionPage; 