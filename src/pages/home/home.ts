import {Component, ViewChild} from '@angular/core';
import {trigger, state, style, animate, transition } from '@angular/animations';
import {NavController, NavParams, Navbar, Content, LoadingController} from 'ionic-angular';
import {AudioProvider} from '../../providers/audio/audio';
import {FormControl} from '@angular/forms';
import {CANPLAY, LOADEDMETADATA, PLAYING, TIMEUPDATE, LOADSTART, RESET} from '../../providers/store';
import {Store} from '@ngrx/store';
import {CloudProvider} from '../../providers/cloud/cloud';
import {AuthService} from '../../providers/auth0/auth.service';
import {pluck, filter, map, distinctUntilChanged} from 'rxjs/operators';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  animations: [
    trigger('showHide', [
      state(
        'active',
        style({
          opacity: 1
        })
      ),
      state(
        'inactive',
        style({
          opacity: 0
        })
      ),
      transition('inactive => active', animate('250ms ease-in')),
      transition('active => inactive', animate('250ms ease-out'))
    ])
  ]
})
export class HomePage {
  files: any = [];
  seekbar: FormControl = new FormControl("seekbar");
  state: any = {};
  onSeekState: boolean;
  currentFile: any = {};
  displayFooter: string = "inactive";
  loggedIn: Boolean;
  @ViewChild(Navbar) navBar: Navbar;
  @ViewChild(Content) content: Content;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public audioProvider: AudioProvider,
    public loadingCtrl: LoadingController,
    public cloudProvider: CloudProvider,
    private store: Store<any>,
    public auth: AuthService
  ) {
    this.auth.isLoggedIn$.subscribe((isLoggedIn: any) => {
      this.loggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.getDocuments();
      }
    });
  }

  getDocuments() {
    let loader = this.presentLoading();
    this.cloudProvider.getFiles().subscribe(files => {
      this.files = files;
      loader.dismiss();
    });
  }

  presentLoading() {
    let loading = this.loadingCtrl.create({
      content: 'Loading Content. Please Wait...'
    });
    loading.present();
    return loading;
  }

  login() {
    this.auth.login()
      .then(() => { console.log('Successful Login'); })
      .catch(error => { console.log(error); });
  }

  ionViewWillLoad() {
    this.store.select('appState').subscribe((value: any) => {
      this.state = value.media;
    });

    // Ionic がフッターに対応するように Content Screen のサイズを変更します
    this.store
      .select('appState')
      .pipe(pluck('media', 'canplay'), filter(value => value === true))
      .subscribe(() => {
        this.displayFooter = 'active';
        this.content.resize();
      });

    // currentTime に基づいてシークバーを更新します
    this.store
      .select('appState')
      .pipe(
        pluck('media', 'timeSec'),
        filter(value => value !== undefined),
        map((value: any) => Number.parseInt(value)),
        distinctUntilChanged()
      )
      .subscribe((value: any) => {
        this.seekbar.setValue(value);
      });
  }
  
}