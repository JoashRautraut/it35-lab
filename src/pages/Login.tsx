import { 
  IonAlert,
  IonAvatar,
  IonButton,
  IonContent, 
  IonIcon, 
  IonInput, 
  IonInputPasswordToggle,  
  IonPage,  
  IonToast,  
  useIonRouter
} from '@ionic/react';
import { logoIonic } from 'ionicons/icons';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClients';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const doLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAlertMessage(error.message);
      setShowAlert(true);
      return;
    }

    setShowToast(true); 
    setTimeout(() => {
      navigation.push('/it35-lab/app', 'forward', 'replace');
    }, 300);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ background: '#f5f7fa' }}>
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh', // Full screen height
            padding: '30px',
          }}
        >
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '400px',
              padding: '40px 30px',
            }}
          >
            <IonAvatar
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '20px',
                border: '2px solid #0056b3',
              }}
            >
              {/* Replace the Ionic logo with your custom image */}
              <img src="https://m.media-amazon.com/images/S/pv-target-images/48448d3f65992c3c9da909933f7fa659efe20d88becd4b62459bc62e0da1889a.jpg" alt="User Avatar" style={{ width: '100%', height: '100%' }} />
              
            
              
            </IonAvatar>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: '500',
              color: '#333', // Darker color for visibility
              marginBottom: '20px',
              textAlign: 'center',
            }}>Login</h1>
            <IonInput
              label="Email" 
              labelPlacement="floating" 
              fill="outline"
              type="email"
              placeholder="Enter Email"
              value={email}
              onIonChange={e => setEmail(e.detail.value!)}
              style={{
                width: '100%',
                marginBottom: '15px',
                borderRadius: '8px',
                padding: '12px',
                borderColor: '#ccc',
                color: '#333', // Dark text inside input for better visibility
              }}
            />
            <IonInput 
              fill="outline"
              type="password"
              placeholder="Password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              style={{
                width: '100%',
                marginBottom: '25px',
                borderRadius: '8px',
                padding: '12px',
                borderColor: '#ccc',
                color: '#333', // Dark text inside input for better visibility
              }}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonButton 
              onClick={doLogin} 
              expand="full" 
              shape="round" 
              style={{
                marginBottom: '15px',
                backgroundColor: '#0056b3',
                color: '#fff',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              Login
            </IonButton>

            <IonButton 
              routerLink="/it35-lab/register" 
              expand="full" 
              fill="clear" 
              shape="round" 
              style={{
                fontWeight: '500',
                color: '#0056b3',
              }}
            >
              Don't have an account? Register here
            </IonButton>
          </div>
        </div>

        {/* Reusable AlertBox Component */}
        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

        {/* IonToast for success message */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful! Redirecting..."
          duration={1500}
          position="top"
          color="primary"
          style={{
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
