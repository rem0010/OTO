import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, Subject, observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import * as moment from 'moment';

/*
  Generated class for the AudioProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AudioProvider {
  private stop$ = new Subject();
  private audioObj = new Audio();

  constructor() { }
  
  private streamObservable(url) {
  let events = ['ended', 'error', 'playing', 'pause', 'timeupdate', 'canplay', 'loadedmetadate', 'loadstart'];

  const addEvents = function(obj, events, handler) {
    events.forEach(event => {
      obj.addEventListener(event, handler)
    });
  }

  const removeEvents = function(obj, events, handler){
    events.forEach(event => {
      obj.removeEventsListener(event, handler);
    });
  }


  return Observable.create(observable => {
    //オーディオイベント
    this.audioObj.src = url;
    this.audioObj.load();
    this.audioObj.play();

    //メディアイベント
    const handler = (event) => observable.next(event);
    addEvents(this.audioObj, events, handler);
    
    
    return () => {
      // 再生
      this.audioObj.pause();
      this.audioObj.currentTime = 0;

      // eventlistenerの削除
      removeEvents(this.audioObj, events, handler);
    }
  })
  }

  playStream(url){
    return this.streamObservable(url).pipe(takeUntil(this.stop$))
  }


  play(){
    this.audioObj.play();
  }

  pause(){
    this.audioObj.pause();
  }

  stop(){
    this.stop$.next();
  }

  seekTo(seconds){
    this.audioObj.currentTime = seconds;
  }

  formatTiem(time, format){
    return moment.utc(time).format(format);
  }
}
