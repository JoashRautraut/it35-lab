import { 
  IonButton,
  IonContent, 
  IonHeader, 
  IonInput, 
  IonItem, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonAlert,
  useIonRouter
} from '@ionic/react';
import { useState } from 'react';

const Login: React.FC = () => {
  const navigation = useIonRouter();
  
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const user_email = "hehe@gmail.com";
  const user_pdw = "useruser";

 
  const doLogin = () => {
    if (email !== user_email || password !== user_pdw) {
      setShowAlert(true); 
      return;
    } else {
      console.log(email);
      console.log(password);

      setShowToast(true);
      setTimeout(() => {
       
        navigation.push('/it35-lab/app', 'forward', 'replace');
      }, 1500);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
        
       
        <IonItem>
          <IonInput
            label="Email"
            labelPlacement="floating"
            placeholder="Enter your email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)} // Update email state
            required
          />
        </IonItem>

        <IonItem>
          <IonInput
            label="Password"
            labelPlacement="floating"
            type="password"
            placeholder="Enter your password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)} // Update password state
            required
          />
        </IonItem>

       
        <IonButton onClick={doLogin} expand="full">
          Login
        </IonButton>

       
        {showAlert && (
          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Login Failed"
            message="Incorrect email or password. Please try again."
            buttons={['OK']}
          />
        )}

     
        {showToast && (
          <IonAlert
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            header="Login Successful"
            message="Redirecting to the app..."
            buttons={['OK']}
          />
        )}
        
      </IonContent>
    </IonPage>
  );
};

export default Login;
