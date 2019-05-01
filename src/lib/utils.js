import { actions } from '~/store'
import validator from 'validator'
import axios from 'axios'
import Router from 'next/router'
import { useState } from 'react'

export function handleFormInput(initialValue) {
  let [value, setValue] = useState(initialValue)
  function handleChange(e) {
    setValue(e.target.value)
  }
  return { value, onChange: handleChange }
}

export function setLoading(isLoading, dispatch) {
  dispatch({
    type: actions.LOADING,
    isLoading
  })
}
/**
 * Programatic redirect
 * @param {OBJECT} ctx - ctx object from 'getInitialProps'
 * @param {STRING} loc - path to redirect to
 */
export function redirect(path, ctx) {
  if (ctx && ctx.res) {
    ctx.res.writeHead(302, { Location: path })
    ctx.res.end()
  } else {
    Router.push(path)
  }
}

export function validPassword(password) {
  try {
    let pass = validator.trim(password)
    let blacklisted = validator.blacklist(pass, `\\[\\]\\\\<>,/:;"'{}|+=()~`)
    return (
      password.length >= 8 &&
      validator.isAscii(pass) &&
      blacklisted.length === password.length
    )
  } catch (err) {
    return false
  }
}

export function parseJWT(token) {
  try {
    let base64Url = token.split('.')[1]
    let base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
  } catch (err) {
    return false
  }
}

/**
 * Parses and saves token information in store
 * @param {string} token - jwt
 * @param {function} dispatch - react-redux dispatch function
 */
export function handleToken(token, dispatch) {
  if (token) {
    let { email, source, username, id } = parseJWT(token)
    dispatch({
      type: actions.CREDS,
      id,
      token,
      email,
      source,
      username
    })
  } else {
    signOut(dispatch)
  }
}

export function signOut(dispatch) {
  axios({
    method: 'GET',
    url: '/api/auth/logout'
  })
    .then(r => {
      dispatch({
        type: actions.LOGOUT
      })
      redirect('/')
    })
    .catch(err => handleError(err))
}

export function handleError(err) {
  console.error(err)
}

export function debounce(func, wait, immediate) {
  let timeout
  return function() {
    let context = this
    let args = arguments

    let later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    let callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}
