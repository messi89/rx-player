/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Observable } from "rxjs/Observable";

import { on } from "../utils/rx-utils";
import EventEmitter from "../utils/eventemitter";
import {
  HTMLVideoElement_,
  MediaSource_,
  isIE,
  isFirefox,
  READY_STATES,
} from "./constants.js";
import * as events from "./events.js";
import {
  requestFullscreen,
  exitFullscreen,
  isFullscreen,
} from "./fullscreen.js";
import {
  requestMediaKeySystemAccess,
  setMediaKeys,
  KeySystemAccess,
} from "./eme";

function isCodecSupported(codec) {
  return !!MediaSource_ && MediaSource_.isTypeSupported(codec);
}

function shouldRenewMediaKeys() {
  return isIE;
}

/**
 * Wait for the MediaSource's sourceopen event and emit. Emit immediatelly if
 * already received.
 * @param {MediaSource}
 * @returns {Observable}
 */
function sourceOpen(mediaSource) {
  if (mediaSource.readyState == "open") {
    return Observable.of(null);
  } else {
    return events.sourceOpen(mediaSource).take(1);
  }
}

/**
 * Returns an observable emitting a single time, as soon as a seek is possible
 * (the metatada are loaded).
 * @param {HTMLMediaElement} videoElement
 * @returns {Observable}
 */
function canSeek(videoElement) {
  if (videoElement.readyState >= READY_STATES.HAVE_METADATA) {
    return Observable.of(null);
  } else {
    return events.loadedMetadata(videoElement).take(1);
  }
}

/**
 * Returns ane observable emitting a single time, as soon as a play is possible.
 * @param {HTMLMediaElement} videoElement
 * @returns {Observable}
 */
function canPlay(videoElement) {
  if (videoElement.readyState >= READY_STATES.HAVE_ENOUGH_DATA) {
    return Observable.of(null);
  } else {
    return on(videoElement, "canplay").take(1);
  }
}


// TODO Lacking side-effect?
if (
  window.WebKitSourceBuffer &&
  !window.WebKitSourceBuffer.prototype.addEventListener
) {

  const SourceBuffer = window.WebKitSourceBuffer;
  const SBProto = SourceBuffer.prototype;

  for (const fnNAme in EventEmitter.prototype) {
    SBProto[fnNAme] = EventEmitter.prototype[fnNAme];
  }

  SBProto.__listeners = [];

  SBProto.appendBuffer = function(data) {
    if (this.updating) {
      throw new Error("updating");
    }
    this.trigger("updatestart");
    this.updating = true;
    try {
      this.append(data);
    } catch(error) {
      this.__emitUpdate("error", error);
      return;
    }
    this.__emitUpdate("update");
  };

  SBProto.__emitUpdate = function(eventName, val) {
    setTimeout(() => {
      this.trigger(eventName, val);
      this.updating = false;
      this.trigger("updateend");
    }, 0);
  };
}

function addTextTrack(video, hidden) {
  let track, trackElement;
  const kind = "subtitles";
  if (isIE) {
    const tracksLength = video.textTracks.length;
    track = tracksLength > 0 ?
      video.textTracks[tracksLength - 1] : video.addTextTrack(kind);
    track.mode = hidden ? track.HIDDEN : track.SHOWING;
  } else {
    // there is no removeTextTrack method... so we need to reuse old
    // text-tracks objects and clean all its pending cues
    trackElement = document.createElement("track");
    video.appendChild(trackElement);
    track = trackElement.track;
    trackElement.kind = kind;
    track.mode = hidden ? "hidden" : "showing";
  }
  return { track, trackElement };
}

/**
 * Returns true if video text tracks (vtt) are supported in the current browser.
 * @returns {Boolean}
 */
function isVTTSupported() {
  return !isIE;
}

/**
 * firefox fix: sometimes the stream can be stalled, even if we are in a
 * buffer.
 * @param {Object} timing
 * @returns {Boolean}
 */
function isPlaybackStuck(timing) {
  const FREEZE_THRESHOLD = 10; // video freeze threshold in seconds
  return (
    isFirefox &&
    timing.stalled &&
    timing.state === "timeupdate" &&
    timing.range &&
    timing.range.end - timing.currentTime > FREEZE_THRESHOLD
  );
}

/*
 * Clear video src attribute.
 *
 * On IE11,  video.src = "" is not sufficient as it
 * does not clear properly the current MediaKey Session.
 * Microsoft recommended to use video.removeAttr("src").
 * @param {HTMLMediaElement} video
 */
function clearVideoSrc(video) {
  video.src = "";
  video.removeAttribute("src");
}

export {
  HTMLVideoElement_,
  KeySystemAccess,
  MediaSource_,
  addTextTrack,
  canPlay,
  canSeek,
  clearVideoSrc,
  events,
  exitFullscreen,
  isCodecSupported,
  isFirefox,
  isFullscreen,
  isIE,
  isPlaybackStuck,
  isVTTSupported,
  requestFullscreen,
  requestMediaKeySystemAccess,
  setMediaKeys,
  shouldRenewMediaKeys,
  sourceOpen,
};