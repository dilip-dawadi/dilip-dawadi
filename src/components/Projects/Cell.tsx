'use client';

import dayjs from 'dayjs';
import Image from 'next/image';
import { useState } from 'react';

import type { Project } from '@/data/projects';
import { PROJECT_IMAGE } from '@/lib/utils';

interface CellProps {
  data: Project;
}

export default function Cell({ data }: CellProps) {
  const { title, subtitle, link, image, date, desc, tech, featured } = data;
  const [imageError, setImageError] = useState(false);

  const hasLink = Boolean(link);

  const cardContent = (
    <>
      <div className="project-card-image">
        {image && !imageError ? (
          <>
            <Image
              src={image}
              alt={title}
              width={PROJECT_IMAGE.width}
              height={PROJECT_IMAGE.height}
              sizes="(max-width: 600px) 100vw, 50vw"
              onError={() => setImageError(true)}
            />
            <div className="project-card-overlay" />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
              fontSize: '0.9rem',
            }}
          >
            No image available
          </div>
        )}
      </div>

      <div className="project-card-content">
        <header className="project-card-header">
          <h3 className="project-card-title">{title}</h3>
          {subtitle && <p className="project-card-subtitle">{subtitle}</p>}
        </header>

        <p className="project-card-desc">{desc}</p>

        {tech && tech.length > 0 && (
          <div className="project-card-tech">
            {tech.map((t) => (
              <span key={t} className="tech-tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <time className="project-card-date" dateTime={date}>
          {dayjs(date).format('YYYY')}
        </time>
      </div>
    </>
  );

  return (
    <article
      className={`project-card ${featured ? 'project-card--featured' : ''} ${!hasLink ? 'project-card--static' : ''}`}
    >
      {hasLink ? (
        <a href={link} className="project-card-link">
          {cardContent}
        </a>
      ) : (
        <div className="project-card-static">{cardContent}</div>
      )}
    </article>
  );
}
