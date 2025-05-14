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
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    if (!email.endsWith('@nbsc.edu.ph')) {
      throw new Error('Only @nbsc.edu.ph email addresses are allowed');
    }
  };

  const doLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting login process...');

      // Validate email
      validateEmail(email);
      
      console.log('Attempting login with:', { email });
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data?.user) {
        console.error('No user data received');
        throw new Error('Login failed - no user data received');
      }

      console.log('Login successful:', data.user);
      
      // Check if user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Error fetching profile');
      }

      if (!profileData) {
        console.log('Creating new profile...');
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              username: data.user.email?.split('@')[0] || 'user',
              avatar_url: 'https://ionicframework.com/docs/img/demos/avatar.svg'
            }
          ]);

        if (createError) {
          console.error('Profile creation error:', createError);
          throw new Error('Error creating profile');
        }
      }

      setShowToast(true);
      setTimeout(() => {
        navigation.push('/it35-lab/app', 'forward', 'replace');
      }, 300);

    } catch (err) {
      console.error('Login process error:', err);
      setAlertMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ background: '#f5f7fa' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '30px',
        }}>
          <div style={{
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
          }}>
            <IonAvatar style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: '20px',
              border: '2px solid #0056b3',
            }}>
              <img src="https://m.media-amazon.com/images/S/pv-target-images/48448d3f65992c3c9da909933f7fa659efe20d88becd4b62459bc62e0da1889a.jpg" alt="User Avatar" style={{ width: '100%', height: '100%' }} />
            </IonAvatar>
            
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: '500',
              color: '#333',
              marginBottom: '20px',
              textAlign: 'center',
            }}>Login</h1>
            
            <IonInput
              label="Email" 
              labelPlacement="floating" 
              fill="outline"
              type="email"
              placeholder="youremail@nbsc.edu.ph"
              value={email}
              onIonChange={e => setEmail(e.detail.value!)}
              style={{
                width: '100%',
                marginBottom: '15px',
                borderRadius: '8px',
                padding: '12px',
                borderColor: '#ccc',
                color: '#333',
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
                color: '#333',
              }}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonButton 
              onClick={doLogin} 
              expand="full" 
              shape="round"
              disabled={isLoading}
              style={{
                marginBottom: '15px',
                backgroundColor: '#0056b3',
                color: '#fff',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
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

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

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
