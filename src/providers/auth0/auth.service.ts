import { Injectable, NgZone } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Subject } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
import Auth0Cordova from '@auth0/cordova';
import * as auth0 from 'auth0-js';

@Injectable()
export class AuthService {
    Auth0 = new auth0.WebAuth(AUTH_CONFIG);
    Client = new Auth0Cordova(AUTH_CONFIG);
    accessToken: string;
    user: any;
    loggedIn: boolean;
    loading = true;
    isLoggedIn$ = new Subject();

    constructor(public zone: NgZone, private storage: Storage) {
        this.storage.get('profile').then(user => (this.user = user));
        this.storage.get('access_token').then(token => (this.accessToken = token));
        this.storage.get('expires_at').then(exp => {
            this.loggedIn = Date.now() < JSON.parse(exp);
            this.loading = false;
            this.isLoggedIn$.next(this.loggedIn);
        });
    }

    login() {
        return new Promise((resolve, reject) => {
            this.loading = true;
            const options = {
                scope: 'openid profile offline_access',
            };
            // Auth0 で認証ログインリクエスト： ログインページを開き、認証結果を取得します
            this.Client.authorize(options, (err, authResult) => {
                if (err) {
                    this.loading = false;
                    reject(err);
                } else {
                    // アクセストークンと ID トークンを設定します
                    this.storage.set('id_token', authResult.idToken);
                    this.storage.set('access_token', authResult.accessToken)
                        .then(() => {
                            // ログイン済みに設定します
                            this.loading = false;
                            this.loggedIn = true;
                            this.isLoggedIn$.next(this.loggedIn);
                            resolve();
                        });
                    this.accessToken = authResult.accessToken;
                    // アクセストークンの有効期限を設定します
                    const expiresAt = JSON.stringify(
                        authResult.expiresIn * 1000 + new Date().getTime()
                    );
                    this.storage.set('expires_at', expiresAt);
                    // ユーザーのプロファイル情報をフェッチします
                    this.Auth0.client.userInfo(this.accessToken, (err, profile) => {
                        if (err) {
                            throw err;
                        }
                        this.storage
                            .set('profile', profile)
                            .then(val => this.zone.run(() => (this.user = profile)));
                    });
                }
            });
        });
    }

    logout() {
        this.storage.remove('profile');
        this.storage.remove('access_token');
        this.storage.remove('expires_at');
        this.storage.remove('id_token');
        this.accessToken = null;
        this.user = {};
        this.loggedIn = false;
        this.isLoggedIn$.next(this.loggedIn);
    }
}