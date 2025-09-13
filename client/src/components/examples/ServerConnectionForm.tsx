import ServerConnectionForm from '../ServerConnectionForm';
import { ServerConnection } from '../ServerConnectionForm';

export default function ServerConnectionFormExample() {
  const handleSave = (connection: ServerConnection) => {
    console.log('Save connection:', connection);
  };

  const handleTest = async (connection: ServerConnection): Promise<boolean> => {
    console.log('Test connection:', connection);
    // Simulate test delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate success/failure
    return Math.random() > 0.3;
  };

  const handleCancel = () => {
    console.log('Cancel connection form');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <ServerConnectionForm
        onSave={handleSave}
        onTest={handleTest}
        onCancel={handleCancel}
      />
    </div>
  );
}