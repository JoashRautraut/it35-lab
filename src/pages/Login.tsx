import { 
    IonButtons,
      IonContent, 
      IonHeader, 
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
            <IonButtons slot='start'>
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>Login</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
        <IonButton onClick={() => doLogin()} expand="full">
          Login
        </IonContent>
      </IonPage>
    );
  };
  
  export default Login;