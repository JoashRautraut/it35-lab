import { 
    IonButtons,
      IonContent, 
      IonHeader, 
      IonIcon, 
      IonItem, 
      IonMenu, 
      IonMenuButton, 
      IonMenuToggle, 
      IonPage, 
      IonRoute, 
      IonRouterOutlet, 
      IonSplitPane, 
      IonTitle, 
      IonToolbar 
  } from '@ionic/react';
import {homeOutline,rocketOutline} from 'ionicons/icons';
  
import { Redirect, Route } from 'react-router';
import about from './about';
import Home from './Home';
  
  const Menu: React.FC = () => {

  const path = [
  {name: 'Home',url:'/it35-lab/app/home', icon:homeOutline},
  {name:'About',url:'/it35-lab/app/about', icon:rocketOutline},

]





    return (
      <IonPage>
        <IonSplitPane contentId='main'>
          <IonMenu content='main'>
<IonHeader>
  <IonToolbar>
    <IonTitle>
      Menu
    </IonTitle>
  </IonToolbar>
</IonHeader>

<IonContent>
  {path.map((item,index)=>(
    <IonMenuToggle key={index}>
      <IonItem routerLink={item.url} routerDirection='forward'>
        <IonIcon icon={item.icon} slot='start'>

        </IonIcon>
        {item.name}
      </IonItem>
    </IonMenuToggle>

  ))}
</IonContent>
          </IonMenu>

        </IonSplitPane>

        <IonRouterOutlet id='main'>
          <Route exact path="/it35-lab/app/home" component={Home}></Route>
          <Route exact path="/it35-lab/app/about" component={about}></Route>
          
          
         <Route exact path="/it35-lab/app/">
         <Redirect to="/it35-lab/app/home" />
         </Route>
        </IonRouterOutlet>
      </IonPage>
    );
  };
  
  export default Menu;