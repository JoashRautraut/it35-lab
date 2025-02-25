
import { 
  IonButton,
  IonButtons,
    IonContent, 
    IonHeader, 
    IonInput, 
    IonItem, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar, 
    useIonRouter
} from '@ionic/react';

const Login: React.FC = () => {
  const navigation = useIonRouter();

  const doLogin = () => {
      navigation.push('/it35-lab/app','forward','replace');
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
          <IonItem>
        <IonInput label="UserName:" labelPlacement="floating" placeholder="Enter Username"></IonInput>
      </IonItem>
      <IonItem>
        <IonInput label="Password:" type="password" value="password"></IonInput>
      </IonItem>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
          <IonButton onClick={() => doLogin()} expand="full">
              Login
          </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
