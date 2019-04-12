import React from 'react'
import axios from 'axios'
import Link from 'next/link'
import ReCAPTCHA from 'react-google-recaptcha'
import { toast } from 'react-toastify'
import { actions } from '~/store'
import { connect } from 'react-redux'
import {
  handleError,
  handleToken,
  validPassword,
  validName,
  redirect
} from '~/lib/utils'

class Register extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      password: '',
      confirm: '',
      recaptcha: '',
      loaded: false
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.setLoading = this.setLoading.bind(this)
    this.clear = this.clear.bind(this)
    this.recaptcha // added by ref
    this.form // added by ref
  }

  /**
   * @param {Array} inputs : Array of inputs to clear. The first of which will recieve focus.
   */
  clear(inputs) {
    inputs.forEach(e => (this.form.querySelector(`#${e}`).value = ''))
    this.form.querySelector(`#${inputs[0]}`).focus()
  }

  setLoading(isLoading) {
    this.props.dispatch({
      type: actions.LOADING,
      isLoading
    })
  }

  handleChange(e) {
    // for form inputs
    if (e.target) {
      let obj = {}
      let id = e.target.id
      let val = e.target.value
      obj[id] = val
      this.setState({ ...this.state, ...obj })
    } else {
      this.setState(Object.assign(this.state, { recaptcha: e }))
    }
  }

  handleSubmit(e) {
    e.preventDefault()
    const { dispatch } = this.props

    this.setLoading(true)
    // check if confirmation password matches
    if (this.state.confirm !== this.state.password) {
      return toast.warn('Passwords do not match.')
    }

    if (!validPassword(this.state.password)) {
      this.clear(['password', 'confirm'])
      return toast.error(
        'Password must be 8 characters. Special characters allowed are .!@#$%^&*'
      )
    }

    if (!validName(this.state.name)) {
      this.clear(['password', 'confirm'])
      return toast.error('Invalid characters found in name.')
    }

    // split name up
    let splitName = this.state.name.split(' ')
    let data = Object.assign(this.state, {
      fname: splitName[0],
      lname: splitName.slice(1).join(' ')
    })

    // send request
    axios({
      method: 'post',
      url: `/api/auth/register`,
      data: data
    })
      .then(r => {
        this.setLoading(false)
        handleToken(r.data.token, dispatch)
        redirect('/')
      })
      .catch(err => {
        this.setLoading(false)
        if (err.request.status === 409) {
          toast.info(
            'It appears you may already have an account. Try to login.'
          )
        } else {
          toast.error('Oops. Something went wrong...')
          handleError(err)
        }
      })
  }

  render() {
    return (
      <div className="register page center">
        <h1>Register</h1>
        <form
          className="form"
          id="register"
          onSubmit={this.handleSubmit}
          ref={n => (this.form = n)}
        >
          <div className="form__input-group">
            <label htmlFor="name">Full Name:</label>
            <input
              id="name"
              type="text"
              required
              onChange={this.handleChange}
            />
          </div>
          <div className="form__input-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              size="30"
              required
              onChange={this.handleChange}
              value={this.state.email}
            />
          </div>
          <div className="form__input-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              required
              onChange={this.handleChange}
            />
          </div>
          <div className="form__input-group">
            <label htmlFor="confirm">Confirm Password:</label>
            <input
              id="confirm"
              type="password"
              required
              onChange={this.handleChange}
            />
          </div>
          <ReCAPTCHA
            ref={n => (this.recaptcha = n)}
            sitekey={this.props.CAPTCHA_SITE_KEY}
            onChange={this.handleChange}
          />
          <button type="submit">Submit</button>
        </form>
        <Link href="/login">
          <a className="small italic link">Already a member? Login here.</a>
        </Link>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  profile: state.profile,
  CAPTCHA_SITE_KEY: state.constants.CAPTCHA_SITE_KEY
})
export default connect(mapStateToProps)(Register)
