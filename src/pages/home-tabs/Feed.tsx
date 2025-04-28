import { 
  IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent, 
    IonHeader, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar 
} from '@ionic/react';

const Feed: React.FC = () => {
  
  return (
    
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
          <IonCard>
    <img alt="Silhouette of mountains" src="https://www.unwindworldwide.com/images/tour-operators/pics/explore.jpg" />
    <IonCardHeader>
      <IonCardTitle>Explore</IonCardTitle>
      <IonCardSubtitle>Making new Memories</IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent>looking for new learnings</IonCardContent>
    </IonCard>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          
          
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
       
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', }} > Feed </div>
      
      </IonContent>
    </IonPage>
  );
};
export default Feed;