import React from 'react'
import { Link } from 'react-router-dom'

function CardItem(props) {
  const isList = props.viewMode === 'list';

  if (isList) {
	return (
		<li className='cards__item cards__item--list'>
			<Link className='cards__item__link cards__item__link--list' to={props.path}>
				<figure className='cards__item__pic-wrap cards__item__pic-wrap--list' data-category={props.label}>
					<img
					src={props.src}
					alt='cardImage'
					className='cards__item__img'
					/>
				</figure>
				<div className='cards__item__info cards__item__info--list'>
					<h5 className='cards__item__text cards__item__title--list'>{props.label}</h5>
					<span className='cards__item__label--list'>{props.text}</span>
				</div>
			</Link>
		</li>
	)
  }

  return (
	<>
		<li className='cards__item'>
			<Link className='cards__item__link' to={props.path}>
				<figure className='cards__item__pic-wrap' data-category={props.label}>
					<img
					src={props.src}
					alt='cardImage'
					className='cards__item__img'
					/>
				</figure>
				<div className='cards__item__info'>
					<h5 className='cards__item__text'>{props.text}</h5>
				</div>
			</Link>
		</li>
	</>
  )
}

export default CardItem
