import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Onboarding.module.css'
import { supabase } from '../../../../supabaseClient'

const gradesOptions = [
  'A',
  'A-',
  'AB',
  'B+',
  'B',
  'B-',
  'BC',
  'C+',
  'C',
  'D',
  'F',
]

const Baseline = ({ user, prevStep }) => {
  const [categories, setCategories] = useState([])
  const [grades, setGrades] = useState({})
  const [descriptions, setDescriptions] = useState({})
  const [error, setError] = useState('')
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) {
        console.error('User is not defined, redirecting to login.')
        navigate('/login')
        return
      }

      try {
        const { data, error } = await supabase
          .from('gpa_categories')
          .select('id, category_name')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching categories:', error.message)
        } else {
          setCategories(
            data.map((item) => ({ id: item.id, name: item.category_name }))
          )
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      }
    }

    fetchCategories()
  }, [user, navigate])

  // Update submit button status based on if all categories have grades
  useEffect(() => {
    const allGradesSelected =
      categories.length > 0 &&
      categories.every((category) => grades[category.id])
    setIsSubmitEnabled(allGradesSelected)
  }, [grades, categories])

  const handleGradeChange = (categoryId, grade) => {
    setGrades((prevGrades) => ({
      ...prevGrades,
      [categoryId]: grade,
    }))
  }

  const handleDescriptionChange = (categoryId, description) => {
    setDescriptions((prevDescriptions) => ({
      ...prevDescriptions,
      [categoryId]: description,
    }))
  }

  const handleSubmit = async () => {
    // Prepare the data for the report_data field in JSON format
    const reportData = categories.map((category) => ({
      category_id: category.id,
      grade: grades[category.id] || '',
      description: descriptions[category.id] || '',
    }))

    try {
      // Insert the report into the correct table named 'report_cards'
      const { data, error } = await supabase.from('report_cards').insert([
        {
          user_id: user.id,
          report_data: reportData, // Save the data in the 'report_data' column
        },
      ])

      if (error) {
        console.error('Error saving baseline report:', error.message)
        console.error('Full error object:', error) // Log the full error for better debugging
        setError('Failed to save baseline report. Please try again.')
      } else {
        console.log('Baseline report successfully saved!', data)
        // Navigate to the /life-gpa/home page or the next onboarding step
        navigate('/life-gpa/home')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className={styles['wizard-step-container']}>
      <h2 className={styles['step-heading']}>Set Your Baseline Grades</h2>
      <p className={styles['step-description']}>
        Set a baseline for yourself by grading each category in your Life GPA.
      </p>

      <div className={styles['grades-container']}>
        {categories.map((category) => (
          <div key={category.id} className={styles['category-item']}>
            <label
              className={styles['category-label']}
              htmlFor={`grade-${category.id}`}
            >
              {category.name}
            </label>
            <div className={styles['input-row']}>
              <div className={styles['select-wrapper']}>
                <select
                  id={`grade-${category.id}`}
                  className={styles['grade-select']}
                  value={grades[category.id] || ''}
                  onChange={(e) =>
                    handleGradeChange(category.id, e.target.value)
                  }
                >
                  <option value='' disabled>
                    Select Grade
                  </option>
                  {gradesOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className={styles['description-input']}
                placeholder='Add a description for your grade (optional)'
                value={descriptions[category.id] || ''}
                onChange={(e) =>
                  handleDescriptionChange(category.id, e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className={styles['error-message']}>{error}</p>}

      <div className={styles['button-container']}>
        <button
          onClick={prevStep}
          className={`${styles.button} ${styles['button-secondary']}`}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className={`${styles.button} ${styles['button-primary']}`}
          disabled={!isSubmitEnabled}
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Baseline
