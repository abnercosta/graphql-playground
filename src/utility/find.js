/* @flow */
/* eslint-disable no-undef */

export default function find (list, predicate) {
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }
}
