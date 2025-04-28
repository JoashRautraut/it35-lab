import { 
    IonButtons,
      IonContent, 
      IonHeader, 
      IonMenuButton, 
      IonPage, 
      IonSearchbar, 
      IonTitle, 
      IonToolbar 
  } from '@ionic/react';
  
  const Search: React.FC = () => {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot='start'>
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>Search</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
        <IonSearchbar color="medium" placeholder="Medium"></IonSearchbar>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', }} > Search </div>
        </IonContent>
      </IonPage>
    );
  };
 export default Search;