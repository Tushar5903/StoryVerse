import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import { DEFAULT_GENRES, genrePath } from '../../data/genres'
import './GenrePage.css'
export default function GenrePage(){return <><SharedNav/><main className="genre-page"><div className="eyebrow">FIND YOUR MOOD</div><h1>Genres.</h1><div className="genre-tiles">{DEFAULT_GENRES.map((genre,index)=><Link className={`genre-tile-new g${index % 10}`} to={`/genre/${genrePath(genre)}`} key={genre}><span>{genre}</span><small>Explore <FiArrowRight /></small></Link>)}</div></main><Footer/></>}
