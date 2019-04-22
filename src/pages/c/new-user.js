import React from 'react'
import axios from 'axios'
import Link from 'next/link'
import { actions } from '~/store'
import { toast } from 'react-toastify'
import { connect } from 'react-redux'
import { handleError, handleToken, redirect, setLoading } from '~/lib/utils'

class NewUser extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.setLoading = this.setLoading.bind(this)
    this.form // added by ref
  }

  static async getInitialProps(ctx) {
    let url,
      headers,
      { req, query } = ctx
    try {
      if (req) {
        url = `${req.protocol}://${req.headers.host}/api/me`
        headers = { cookie: req.headers.cookie }
      } else {
        url = '/api/me'
      }

      let r = await axios({
        method: 'GET',
        url: url,
        headers: headers
      })
      return { profile: r.data.data }
    } catch (err) {
      toast.error('Oops. Not authorized yet. Please login')
      return { query }
    }
  }

  componentDidMount() {
    const { dispatch, query } = this.props
    // get data from token
    if (query && query.token) {
      handleToken(query.token, dispatch)
      // get data from /api/me
    } else {
      dispatch({
        type: actions.PROFILE,
        profile: this.props.profile
      })
    }
  }

  setLoading(isLoading) {
    setLoading(isLoading, this.props.dispatch)
  }

  handleChange(e) {
    const { dispatch } = this.props
    let id = e.target.id
    let val = e.target.value
    let obj = {}
    obj[id] = val
    dispatch({
      type: actions.PROFILE,
      ...obj
    })
  }

  async handleSubmit(e) {
    e.preventDefault()
    // start async process
    this.setLoading(true)
    const { dispatch } = this.props
    let data = this.props.profile
    const captchaToken = await this.props.reCaptcha.execute({
      action: 'register'
    })
    // send request
    axios({
      method: 'post',
      url: `/api/auth/complete-profile`,
      data: { ...data, recaptcha: captchaToken }
    })
      .then(r => {
        this.setLoading(false)
        handleToken(r.data.data.token, dispatch)
        redirect('/u')
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
    const p = this.props.profile
    return (
      <div className="register page center">
        <h1>Complete Profile</h1>
        <p>
          There are just a few more things we need to complete your profile.
        </p>
        <h3>ID: {this.props.profile.id}</h3>
        <h3>Source: {this.props.profile.source}</h3>
        <form
          className="form"
          id="register"
          onSubmit={this.handleSubmit}
          ref={n => (this.form = n)}
        >
          <div className="form__input-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              required
              onChange={this.handleChange}
              value={p.username || ''}
            />
          </div>
          <div className="form__input-group">
            <label htmlFor="region">Region:</label>
            <input
              id="region"
              type="text"
              required
              onChange={this.handleChange}
              value={p.region || ''}
            />
          </div>
          <div className="form__input-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              required
              onChange={this.handleChange}
              value={p.email || ''}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
        <Link href="/c/login">
          <a className="small italic link">Already a member? Login here.</a>
        </Link>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  profile: state.profile,
  query: ownProps.query
})
export default connect(mapStateToProps)(NewUser)
