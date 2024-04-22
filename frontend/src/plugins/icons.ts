/**
 * @file include in generated bundle only selected Fontawesome icons.
 */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faFacebookSquare,
  faFlickr,
  faGooglePlusSquare,
  faInstagram,
  faLinkedin,
  faTwitterSquare,
  faYoutube,
  /* faTripadvisor */
} from '@fortawesome/free-brands-svg-icons';
import {
  faArrowUpRightFromSquare,
  faBars,
  faChevronUp,
  faEnvelope,
  faExpandArrowsAlt,
  faGear,
  faHome,
  faInbox,
  faInfo,
  faKey,
  faLanguage,
  faLayerGroup,
  faMapMarkerAlt,
  faNewspaper,
  faPencilAlt,
  faPhoneAlt,
  faSearch,
  faSignOutAlt,
  faTimes,
  faUser,
  faUserLock,
  faUserSecret,
  faUserShield,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faUserShield,
  faUserSecret,
  faKey,
  faMapMarkerAlt,
  faInbox,
  faNewspaper,
  faInfo,
  faUserLock,
  faLanguage,
  faPhoneAlt,
  faEnvelope,
  faUser,
  faFacebookSquare,
  faGooglePlusSquare,
  faYoutube,
  faFlickr,
  /* faTripadvisor, */
  faTwitterSquare,
  faInstagram,
  faLinkedin,
  faExpandArrowsAlt,
  faTimes,
  faSignOutAlt,
  faPencilAlt,
  faSearch,
  faHome,
  faGear,
  faBars,
  faXmark,
  faArrowUpRightFromSquare,
  faChevronUp,
  faLayerGroup,
);

export { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
