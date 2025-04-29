import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { logoTwitter, logoFacebook, logoInstagram } from 'ionicons/icons';

const About: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen style={{ backgroundColor: '#f7f7f7' }}>
        {/* About Section */}
        <IonCard style={{ margin: '15px', borderRadius: '10px' }}>
          <IonCardHeader>
            <IonTitle style={{ textAlign: 'center', color: '#333' }}>About This App</IonTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p style={{ fontSize: '1.1rem', color: '#555' }}>
                Welcome to our app! This platform allows users to share their thoughts, connect with others, and engage in meaningful discussions. Whether you're posting updates, commenting on others' posts, or liking your favorite content, our app aims to bring a modern social experience to your fingertips.
              </p>
              <p style={{ fontSize: '1.1rem', color: '#555' }}>
                We value user interaction and strive to create a space that fosters communication and engagement. Stay connected with us and explore the latest trends.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Contact and Social Media */}
        <IonCard style={{ margin: '15px', borderRadius: '10px' }}>
          <IonCardHeader>
            <IonTitle style={{ textAlign: 'center', color: '#333' }}>Contact & Follow Us</IonTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
              <p style={{ fontSize: '1rem', color: '#555' }}>
                If you have any questions or feedback, feel free to reach out to us:
              </p>
              <p style={{ fontSize: '1.1rem', color: '#555' }}>
                Email: 20221505@nbsc.edu.ph
              </p>
            </IonText>

            {/* Social Media Links */}
            <IonList>
              <IonItem button href="https://twitter.com" target="_blank">
                <IonIcon slot="start" icon={logoTwitter} style={{ fontSize: '24px', color: '#1DA1F2' }} />
                <IonLabel>Twitter</IonLabel>
              </IonItem>
              <IonItem button href="https://facebook.com" target="_blank">
                <IonIcon slot="start" icon={logoFacebook} style={{ fontSize: '24px', color: '#4267B2' }} />
                <IonLabel>Facebook</IonLabel>
              </IonItem>
              <IonItem button href="https://instagram.com" target="_blank">
                <IonIcon slot="start" icon={logoInstagram} style={{ fontSize: '24px', color: '#E4405F' }} />
                <IonLabel>Instagram</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Version Info */}
        <IonCard style={{ margin: '15px', borderRadius: '10px' }}>
          <IonCardHeader>
            <IonTitle style={{ textAlign: 'center', color: '#333' }}>App Information</IonTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText style={{ display: 'block', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#555' }}>
                Version: 1.0.0
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default About;
