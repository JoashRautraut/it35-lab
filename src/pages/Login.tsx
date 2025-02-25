import { 
  IonAvatar,
  IonButton,
  IonButtons,
    IonContent, 
    IonHeader, 
    IonIcon, 
    IonInput, 
    IonInputPasswordToggle, 
    IonItem, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar, 
    useIonRouter
} from '@ionic/react';
import { logoIonic } from 'ionicons/icons';

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
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }} > 
      <IonAvatar>
        <img alt="Silhouette of a person's head" src="https://ionicframework.com/docs/img/demos/avatar.svg" />  </IonAvatar>

      <IonItem>
<IonInput type="password" label="Password:" value="" placeholder="Password">
<IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
  <IonInput label="Username:" placeholder="Username" >
</IonInput>
  </IonInput>

</IonItem>
      </div>
          <IonButton onClick={() => doLogin()} expand="full">
              Login
          </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;