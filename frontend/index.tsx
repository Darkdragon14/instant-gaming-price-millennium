import { definePlugin, Field } from '@steambrew/client';

const Icon = () => (
  <div
    style={{
      width: '18px',
      height: '18px',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '4px',
      background: 'linear-gradient(135deg, #ff8020, #ff4020)',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 700,
    }}
  >
    IG
  </div>
);

const Settings = () => (
  <Field
    label="Instant Gaming Price"
    description="Les offres sont ajoutées automatiquement aux fiches de jeux et à la liste de souhaits Steam."
    icon={<Icon />}
  />
);

export default definePlugin(() => {
  console.info('Instant Gaming Price: frontend initialisé');
  return {
    title: 'Instant Gaming Price',
    icon: <Icon />,
    content: <Settings />,
  };
});
